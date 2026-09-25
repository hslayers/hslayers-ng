import { readFile, writeFile, mkdir } from 'node:fs/promises';
import pug from 'pug';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bodyLimit } from 'hono/body-limit';
import { serve } from '@hono/node-server';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_PAYLOAD_LIMIT_BYTES = 100 * 1024; // 100 KB, matches previous default
const VIEWS_DIR = join(__dirname, 'views');
const DEFAULT_STORE_PATH = join(__dirname, 'share-store.json');

const socialShareTemplatePath = join(VIEWS_DIR, 'socialShare.pug');
const isProduction = process.env.NODE_ENV === 'production';
const storePath = process.env.SHARE_STORE_PATH || process.env.DB_PATH || DEFAULT_STORE_PATH;
let writeQueue = Promise.resolve();

/**
 * Compile the social-share template once in production, or on every call
 * in development so template edits are picked up without a restart.
 */
const renderSocialShare = (() => {
  if (isProduction) {
    const compiled = pug.compileFile(socialShareTemplatePath);
    return (locals) => compiled(locals);
  }
  return (locals) =>
    pug.renderFile(socialShareTemplatePath, { cache: false, ...locals });
})();

export const app = new Hono();

app.use('*', cors());
app.use(
  '*',
  bodyLimit({
    maxSize: parsePayloadLimit(process.env.PAYLOAD_LIMIT),
    onError: (c) =>
      jsonResponse(
        c,
        { success: false, error: 'Payload too large' },
        413,
      ),
  }),
);

app.get('/', (c) => {
  const request = c.req.query('request');
  const id = c.req.query('id');

  if (!request) {
    return jsonResponse(c, { success: false, error: 'Request not specified' }, 400);
  }

  switch (request.toLowerCase()) {
    case 'load':
      return getCompositionRecord(c, id);

    case 'socialshare':
      return getSocialShareRecord(c, id);

    case 'loadsocialsharethumb':
      return getThumbnail(c, id);

    case 'list': // backward compatibility only
      return jsonResponse(
        c,
        { success: true, results: [], error: 'no data' },
        200,
      );

    default:
      return jsonResponse(c, { success: false, error: 'Request not specified' }, 400);
  }
});

app.post('/', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return jsonResponse(
      c,
      { success: false, error: 'Request body is not valid JSON' },
      400,
    );
  }

  if (!body || !body.request) {
    console.error('Request not specified - no html body');
    return jsonResponse(
      c,
      { success: false, error: 'Request not specified - no html body' },
      400,
    );
  }

  switch (String(body.request).toLowerCase()) {
    case 'save':
      return insertRecord(c, { id: body.id, data: JSON.stringify(body.data) });

    case 'socialshare':
      return insertRecord(c, {
        id: body.id,
        data: JSON.stringify({
          url: body.url,
          title: body.title,
          description: body.description,
          image: body.image,
        }),
      });

    default:
      console.error('Request not specified - switch');
      return jsonResponse(
        c,
        { success: false, error: 'Request not specified - switch' },
        400,
      );
  }
});

const port = Number.parseInt(process.env.SHARING_PORT || '8086', 10);
const host = process.env.HOST || '0.0.0.0';

export const share = serve(
  {
    fetch: app.fetch,
    hostname: host,
    port,
  },
  (info) => {
    console.log(
      `HSLayers map share service listening on port ${info.port}`,
    );
  },
);

/**
 * Find composition by its ID and return it as JSON.
 */
function getCompositionRecord(c, id) {
  return queryCollection(c, id, (result) => jsonResponse(c, result, 200));
}

/**
 * Find composition social share record by its ID and render it as HTML.
 */
function getSocialShareRecord(c, id) {
  return queryCollection(c, id, (result) => {
    const html = renderSocialShare({ id, record: result.data });
    return c.html(html);
  });
}

function getThumbnail(c, id) {
  return queryCollection(c, id, (result) => {
    if (!result.data.image) {
      return jsonResponse(
        c,
        {
          success: false,
          id,
          error: 'thumbnail not available for specified record',
        },
        404,
      );
    }

    if (result.data.image.startsWith('data:')) {
      const contentType = result.data.image.substring(
        5,
        result.data.image.indexOf('base64') - 1,
      );
      const base64Data = result.data.image.replace(
        /^data:image\/(png|jpeg|jpg);base64,/,
        '',
      );
      const img = Buffer.from(base64Data, 'base64');
      return new Response(img, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(img.length),
        },
      });
    }

    // Fallback: return the raw (non-data URL) image reference as text.
    return c.body(result.data.image);
  });
}

/**
 * Query a record by id. The callback is invoked with the hydrated record
 * and is expected to return a Response (or Promise<Response>).
 */
async function queryCollection(c, id, callback) {
  try {
    const store = await readStore();
    const result = store[id];
    if (!result) {
      return jsonResponse(
        c,
        { success: false, id, error: 'record not found' },
        404,
      );
    }
    return callback({
      success: true,
      id,
      data: result,
    });
  } catch (err) {
    return jsonResponse(
      c,
      { success: false, id, error: err.message },
      500,
    );
  }
}

/**
 * Generic insert helper for the `share` table.
 */
async function insertRecord(c, record) {
  try {
    await queueWrite(async () => {
      const store = await readStore();
      if (store[record.id]) {
        throw new Error('UNIQUE constraint failed: share.id');
      }
      store[record.id] = JSON.parse(record.data);
      await writeStore(store);
    });
    return jsonResponse(c, { success: true, id: record.id }, 200);
  } catch (err) {
    return jsonResponse(
      c,
      { success: false, id: record.id, error: err.message },
      500,
    );
  }
}

async function readStore() {
  try {
    const raw = await readFile(storePath, 'utf8');
    if (!raw.trim()) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

async function writeStore(store) {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(store)}\n`, 'utf8');
}

function queueWrite(task) {
  const run = writeQueue.then(() => task());
  writeQueue = run.catch(() => {});
  return run;
}

/**
 * Build a JSON response, honoring `?f=pjson` for pretty-printed output.
 */
function jsonResponse(c, obj, statusCode = 200) {
  const pretty = c.req.query('f') === 'pjson';
  const payload = pretty ? JSON.stringify(obj, null, 4) : JSON.stringify(obj);
  return new Response(payload, {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Parse a size string like "100kb" or "1mb" into bytes. Falls back to the
 * legacy 100 KB default when missing or malformed.
 */
function parsePayloadLimit(raw) {
  if (!raw) return DEFAULT_PAYLOAD_LIMIT_BYTES;
  const match = String(raw)
    .trim()
    .toLowerCase()
    .match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return DEFAULT_PAYLOAD_LIMIT_BYTES;
  const value = Number.parseFloat(match[1]);
  const unit = match[2] || 'b';
  const multipliers = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  return Math.floor(value * multipliers[unit]);
}
