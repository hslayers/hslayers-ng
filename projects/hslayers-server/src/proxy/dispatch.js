import http from 'node:http';
import https from 'node:https';
import { Readable } from 'node:stream';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BODY_MB = 50;

/**
 * Perform a single upstream request with a pinned IP (DNS-rebinding proof),
 * enforced timeout, and a manual-redirect policy. The caller is responsible
 * for pre-validating the URL (scheme/port/userinfo, SSRF screening, and
 * request classification) before calling this function.
 *
 * Uses Node's built-in `http`/`https` modules so no third-party HTTP client
 * is required. The pinned IP is injected through the standard `lookup`
 * socket option; the TLS SNI and the `Host` header keep the original
 * hostname so virtual-hosted services still route correctly.
 *
 * @param {object} params
 * @param {URL} params.url - Fully validated upstream URL.
 * @param {string} params.method - HTTP method.
 * @param {Record<string, string>} params.headers - Forwarded request headers.
 * @param {Uint8Array | Buffer | undefined} params.body - Request body for POST.
 * @param {{address: string, family: 4 | 6}} params.pinnedAddr - Address to pin.
 * @returns {Promise<Response>}
 */
export function fetchUpstream({ url, method, headers, body, pinnedAddr }) {
  return new Promise((resolve, reject) => {
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const timeout = getTimeoutMs();

    const outgoingHeaders = { ...headers };
    if (!outgoingHeaders.host && !outgoingHeaders.Host) {
      outgoingHeaders.host = url.host;
    }
    if (body && body.byteLength > 0 && !hasHeader(outgoingHeaders, 'content-length')) {
      outgoingHeaders['content-length'] = String(body.byteLength);
    }

    const req = lib.request(
      {
        method,
        host: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: (url.pathname || '/') + url.search,
        headers: outgoingHeaders,
        servername: isHttps ? url.hostname : undefined,
        lookup: (_hostname, options, cb) => {
          // Node 20+ autoSelectFamily (Happy Eyeballs) calls lookup with
          // options.all === true and expects cb(err, [{address, family}, ...]).
          // Otherwise it expects the classic cb(err, address, family) shape.
          if (options && options.all) {
            cb(null, [
              { address: pinnedAddr.address, family: pinnedAddr.family },
            ]);
          } else {
            cb(null, pinnedAddr.address, pinnedAddr.family);
          }
        },
      },
      (res) => {
        resolve(toFetchResponse(res));
      },
    );

    req.setTimeout(timeout, () => {
      req.destroy(new Error(`Upstream timed out after ${timeout} ms`));
    });
    req.on('error', reject);

    if (body && body.byteLength > 0) {
      req.write(body);
    }
    req.end();
  });
}

/**
 * Build a readable stream that enforces a maximum total byte count. When
 * exceeded, the upstream source is cancelled and the stream errors out.
 *
 * @param {ReadableStream<Uint8Array> | null} source
 * @param {number} maxBytes
 * @returns {ReadableStream<Uint8Array> | null}
 */
export function cappedStream(source, maxBytes) {
  if (!source) return null;
  let received = 0;
  const reader = source.getReader();
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        received += value.byteLength;
        if (received > maxBytes) {
          controller.error(
            new Error(`Upstream response exceeded ${maxBytes} bytes`),
          );
          reader.cancel().catch(() => {});
          return;
        }
        controller.enqueue(value);
      } catch (err) {
        controller.error(err);
      }
    },
    cancel(reason) {
      reader.cancel(reason).catch(() => {});
    },
  });
}

export function getMaxBodyBytes() {
  const envMb = Number.parseFloat(process.env.PROXY_MAX_BODY_MB || '');
  const mb = Number.isFinite(envMb) && envMb > 0 ? envMb : DEFAULT_MAX_BODY_MB;
  return Math.floor(mb * 1024 * 1024);
}

export function getTimeoutMs() {
  const env = Number.parseInt(process.env.PROXY_TIMEOUT_MS || '', 10);
  return Number.isInteger(env) && env > 0 ? env : DEFAULT_TIMEOUT_MS;
}

/**
 * Convert a Node `http.IncomingMessage` into a Fetch API `Response` so the
 * rest of the gateway can keep working with WHATWG primitives.
 *
 * @param {import('node:http').IncomingMessage} res
 * @returns {Response}
 */
function toFetchResponse(res) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(res.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(name, v);
    } else {
      headers.set(name, value);
    }
  }
  const body = /** @type {ReadableStream<Uint8Array>} */ (Readable.toWeb(res));
  return new Response(body, {
    status: res.statusCode || 502,
    statusText: res.statusMessage || '',
    headers,
  });
}

function hasHeader(headers, target) {
  const lower = target.toLowerCase();
  for (const name of Object.keys(headers)) {
    if (name.toLowerCase() === lower) return true;
  }
  return false;
}
