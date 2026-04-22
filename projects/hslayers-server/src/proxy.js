import 'dotenv/config';
import escape from 'escape-html';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import {
  encode as encodeQuerystring,
  parse as parseQuerystring,
} from 'node:querystring';
import { networkInterfaces } from 'node:os';
import packageJson from '../package.json' with { type: 'json' };
import { argv } from './config.js';
import { classifyGisRequest } from './proxy/classify.js';
import {
  validateUpstreamUrl,
  resolveAndScreen,
  SsrfError,
} from './proxy/ssrf.js';
import {
  fetchUpstream,
  cappedStream,
  getMaxBodyBytes,
} from './proxy/dispatch.js';
import { applyIntegration } from './proxy/integrations.js';

const host = process.env.HOST || '0.0.0.0';
const port = Number.parseInt(process.env.PROXY_PORT || '8085', 10);

const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'POST', 'OPTIONS']);
const MAX_REDIRECT_HOPS = 3;

/**
 * Request headers that we are willing to forward to upstream GIS services.
 * Everything else (Cookie, Authorization, Host, Origin, Referer, any
 * X-Forwarded-*) is dropped so the gateway cannot be used to leak browser
 * state or impersonate the caller to the upstream.
 */
const SAFE_REQUEST_HEADERS = new Set([
  'accept',
  'accept-language',
  'accept-encoding',
  'range',
  'if-none-match',
  'if-modified-since',
]);

/**
 * Response headers we strip before streaming the upstream response back.
 * Covers hop-by-hop headers plus anything that could set auth state in the
 * browser (cookies, WWW-Authenticate).
 */
const STRIPPED_RESPONSE_HEADERS = new Set([
  'set-cookie',
  'www-authenticate',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
]);

export const app = new Hono();

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
    allowHeaders: ['*'],
    maxAge: 600,
  }),
);

app.all('*', async (c) => {
  const method = c.req.method;
  if (!ALLOWED_METHODS.has(method)) {
    return c.text(`Method ${method} not allowed`, 405);
  }

  const incoming = new URL(c.req.url);
  const rawEmbedded = incoming.pathname + incoming.search;

  if (argv.verbose) {
    console.log('--------------------------------');
    console.log('Request URL: ' + rawEmbedded);
    console.log('Request method: ' + method);
  }

  const stripped = rawEmbedded.replace(/^.*?(\/https?:)/, '$1');

  if (
    !stripped.startsWith('/http://') &&
    !stripped.startsWith('/https://')
  ) {
    return renderInfoPage(c, rawEmbedded);
  }

  let embedded;
  try {
    const decoded = safelyDecodeUrl(stripped);
    embedded = encodeUrlPathAndParams(decoded).replace(/^\//, '');
    if (argv.verbose) {
      console.log('Normalized upstream URL: ' + embedded);
    }
  } catch (err) {
    return c.text('Invalid URL: ' + err.message, 400);
  }

  let body;
  if (method === 'POST') {
    try {
      const buf = await c.req.arrayBuffer();
      if (buf.byteLength > getMaxBodyBytes()) {
        return c.text('Request body too large', 413);
      }
      if (buf.byteLength > 0) {
        body = new Uint8Array(buf);
      }
    } catch (err) {
      return c.text('Invalid request body: ' + err.message, 400);
    }
  }

  try {
    return await dispatchWithRedirects({
      targetUrlString: embedded,
      method,
      clientHeaders: c.req.raw.headers,
      body,
      hopsRemaining: MAX_REDIRECT_HOPS,
    });
  } catch (err) {
    return handleError(err);
  }
});

async function dispatchWithRedirects({
  targetUrlString,
  method,
  clientHeaders,
  body,
  hopsRemaining,
}) {
  let url;
  try {
    url = new URL(targetUrlString);
  } catch (err) {
    throw new GatewayError(400, 'Malformed upstream URL: ' + err.message);
  }

  validateUpstreamUrl(url);

  const classification = classifyGisRequest(url);
  if (classification.kind === 'reject') {
    throw new GatewayError(400, classification.reason);
  }

  const pinnedAddr = await resolveAndScreen(url.hostname);

  const outgoingHeaders = buildUpstreamHeaders(clientHeaders, method);
  applyIntegration(classification.kind, url, outgoingHeaders);

  if (argv.verbose) {
    console.log(
      `Dispatching ${method} ${url.toString()} (kind=${classification.kind}, ip=${pinnedAddr.address})`,
    );
  }

  let upstream;
  try {
    upstream = await fetchUpstream({
      url,
      method,
      headers: headersToRecord(outgoingHeaders),
      body,
      pinnedAddr,
    });
  } catch (err) {
    throw new GatewayError(502, 'Upstream fetch failed: ' + err.message);
  }

  if (isRedirect(upstream.status)) {
    const location = upstream.headers.get('location');
    if (!location) {
      throw new GatewayError(502, 'Upstream sent redirect with no Location');
    }
    if (hopsRemaining <= 0) {
      throw new GatewayError(508, 'Too many redirects');
    }
    const next = new URL(location, url).toString();
    await safeCancel(upstream.body);
    return dispatchWithRedirects({
      targetUrlString: next,
      method: redirectMethod(method, upstream.status),
      clientHeaders,
      body: redirectBody(upstream.status, body),
      hopsRemaining: hopsRemaining - 1,
    });
  }

  return buildClientResponse(upstream);
}

function buildClientResponse(upstream) {
  const headers = new Headers();
  for (const [name, value] of upstream.headers.entries()) {
    if (STRIPPED_RESPONSE_HEADERS.has(name.toLowerCase())) continue;
    headers.set(name, value);
  }

  const contentLength = upstream.headers.get('content-length');
  const max = getMaxBodyBytes();
  if (contentLength && Number.parseInt(contentLength, 10) > max) {
    safeCancel(upstream.body);
    return new Response(
      `Upstream response too large (${contentLength} bytes, max ${max})`,
      {
        status: 502,
        headers: { 'content-type': 'text/plain' },
      },
    );
  }

  const capped = cappedStream(upstream.body, max);
  return new Response(capped, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

function buildUpstreamHeaders(clientHeaders, method) {
  const out = new Headers();
  for (const [name, value] of clientHeaders.entries()) {
    if (SAFE_REQUEST_HEADERS.has(name.toLowerCase())) {
      out.set(name, value);
    }
  }
  if (method === 'POST') {
    const ct = clientHeaders.get('content-type');
    if (ct) out.set('content-type', ct);
  }
  out.set('user-agent', `hslayers-server/${packageJson.version}`);
  return out;
}

function headersToRecord(headers) {
  const out = {};
  for (const [name, value] of headers.entries()) {
    out[name] = value;
  }
  return out;
}

function isRedirect(status) {
  return (
    status === 301 ||
    status === 302 ||
    status === 303 ||
    status === 307 ||
    status === 308
  );
}

function redirectMethod(method, status) {
  return status === 303 ? 'GET' : method;
}

function redirectBody(status, body) {
  return status === 303 ? undefined : body;
}

function safeCancel(stream) {
  if (stream && typeof stream.cancel === 'function') {
    return stream.cancel().catch(() => {});
  }
  return Promise.resolve();
}

function renderInfoPage(c, rawPath) {
  const html =
    'hslayers-server GIS gateway<br>' +
    'version: ' +
    packageJson.version +
    '<br>' +
    'gateway url: ' +
    getIP() +
    ':' +
    port +
    '<br>' +
    'requested url (escaped): ' +
    escape(rawPath) +
    '<br>';
  return c.html(html);
}

function handleError(err) {
  if (argv.verbose) {
    console.error(err);
  }
  if (err instanceof SsrfError) {
    return new Response('Forbidden: ' + err.message, {
      status: 403,
      headers: plainHeaders(),
    });
  }
  if (err instanceof GatewayError) {
    return new Response(err.message, {
      status: err.status,
      headers: plainHeaders(),
    });
  }
  return new Response('Internal gateway error: ' + err.message, {
    status: 500,
    headers: plainHeaders(),
  });
}

function plainHeaders() {
  return {
    'content-type': 'text/plain; charset=utf-8',
    'access-control-allow-origin': '*',
  };
}

class GatewayError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'GatewayError';
  }
}

export const proxy = serve(
  {
    fetch: app.fetch,
    hostname: host,
    port,
  },
  (info) => {
    console.log(
      'HSLayers GIS gateway listening on ' + info.address + ':' + info.port,
    );
  },
);

function getIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '0';
}

/**
 * Created by ChatGPT
 * @param {string} url URL
 * @returns Array consisting of [domain, TLD+port, rest of the URL]
 */
export const splitUrlAtTld = (url) => {
  const tldWithPortRegex = /\.([a-zA-Z]{2,}|[0-9]{1,3})(?::\d+)?(?:\/|$)/;
  const tldWithPortMatch = url.match(tldWithPortRegex);

  if (tldWithPortMatch) {
    const tldWithPort = tldWithPortMatch[0];
    const parts = url.split(tldWithPort);
    const cleanedTLD = tldWithPort.slice(1).replace('/', '');
    return [parts[0], cleanedTLD, parts[1] || ''];
  }
  return [url, '', ''];
};

/**
 * Takes a decoded URL, splits it into parts and encodes its path and search strings
 * but leaves the host name untouched
 * @param {string} url URL
 * @returns partially encoded URL
 */
export const encodeUrlPathAndParams = (url) => {
  const [base, tld, pathAndQueryParams] = splitUrlAtTld(url);
  const encodedPath = pathAndQueryParams
    .split('?')[0]
    .split('/')
    .map((segment) => encodeURIComponent(segment));
  const queryParams = pathAndQueryParams.split('?').slice(1).join('?');
  const params = parseQuerystring(queryParams);
  return (
    base +
    '.' +
    tld +
    '/' +
    encodedPath.join('/') +
    (Object.keys(params).length === 0 ? '' : '?') +
    encodeQuerystring(params)
  );
};

function isUrlEncoded(url) {
  return /%[0-9A-Fa-f]{2}/.test(url);
}

function safelyDecodeUrl(url) {
  try {
    if (isUrlEncoded(url)) {
      return decodeURIComponent(url);
    }
    return url;
  } catch (e) {
    console.warn('Failed to decode URL:', e);
    return url;
  }
}
