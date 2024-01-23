import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const share = express();

// parse incoming POST requests body to JSON
share.use(express.json());
// handle CORS
share.use(cors())
share.set('view engine', 'pug')
share.set('views', __dirname + '/views/');

if (process.env.NODE_ENV !== "production")
  share.disable('view cache');

// handle GET requests
share.get('/', context => {
  if (context.query.request) {
    switch (context.query.request.toLowerCase()) {

      case 'load':
        getCompositionRecord(context.query.id, context);
        break;

      case 'socialshare':
        getSocialShareRecord(context.query.id, context);
        break;

      case 'loadsocialsharethumb':
        getThumbnail(context.query.id, context);
        break;

      case 'list': // only for backward compatibility, should not be used anymore
        formatResponseJson({ "success": true, "results": [], "error": "no data" }, context, 200);
        break;

      default:
        formatResponseJson({ success: false, error: "Request not specified" }, context, 400);
        break;
    }
  }
  else {
    formatResponseJson({ success: false, error: "Request not specified" }, context, 400);
  }
});

// handle POST requests
share.post('/', express.json({
  limit: process.env.PAYLOAD_LIMIT ? process.env.PAYLOAD_LIMIT : '100kb',
  strict: false,
  type: '*/*'
}), context => {
  if (context.body && context.body.request) {
    switch (context.body.request.toLowerCase()) {
      case 'save':
        insertRecord({ id: context.body.id, data: JSON.stringify(context.body.data) }, context);
        break;

      case 'socialshare':
        insertRecord({
          id: context.body.id,
          data: JSON.stringify({
            url: context.body.url,
            title: context.body.title,
            description: context.body.description,
            image: context.body.image
          })
        }, context);
        break;

      default:
        console.error("Request not specified - switch");
        formatResponseJson({ success: false, error: "Request not specified - switch" }, context, 400);
    }
  }
  else {
    console.error("Request not specified - no html body");
    formatResponseJson({ success: false, error: "Request not specified - no html body" }, context, 400);
  }
});

// start the service on the port xxxx
share.listen(process.env.SHARING_PORT || 8086, () => console.log(`HSLayers map share service listening on port ${process.env.SHARING_PORT || 8086}`));


/**
 * Find composition by its ID and return it as JSON
 * @param {any} id ID of the composition to look for
 * @param {any} context HTTP context of the request
 */
function getCompositionRecord(id, context) {
  queryCollection(id, context, function (result) {
    formatResponseJson(result, context);
  });
}

/**
 * Find composition social share record by its ID and render it as HTML
 * @param {any} id ID of the composition to look for
 * @param {any} context HTTP context of the request
 */
function getSocialShareRecord(id, context) {
  queryCollection(id, context, function (result) {
    context.res.render('socialShare', { id: id, record: result.data });
  });
}

function getThumbnail(id, context) {
  queryCollection(id, context, function (result) {
    if (result.data.image) {
      if (result.data.image.startsWith('data:')) {
        var contentType = result.data.image.substring(5, result.data.image.indexOf("base64") - 1);
        var base64Data = result.data.image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
        var img = Buffer.from(base64Data, 'base64');

        context.res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': img.length
        });
        context.res.end(img);
      }
      else {
        // TODO
        context.res.send(result.data.image);
      }
    }
    else {
      formatResponseJson({ success: false, id: id, error: 'thumbnail not available for specified record' }, context, 404);
    }
  });
}

/**
 * Query record with the ID specified
 * @param {any} id Record id
 * @param {any} callback Callback function
 */
function queryCollection(id, context, callback) {
  const db = new Database(process.env.DB_PATH, process.env.NODE_ENV == "production" ? {} : { verbose: console.log });

  try {
    const result = db.prepare('SELECT * FROM share WHERE id = ?').get(id);

    if (result) {
      callback({ success: true, id: result.id, data: JSON.parse(result.data) });
    }
    else {
      formatResponseJson({ success: false, id: id, error: 'record not found' }, context, 404);
    }
  }
  catch (err) {
    formatResponseJson({ success: false, id: id, error: err.message }, context, 500);
  }
  finally {
    db.close();
  }
}

/**
 * Generic method to insert an item in the DB
 * @param {any} record Item to be inserted
 * @param {any} context HTTP context of the request
 */
function insertRecord(record, context) {
  const db = new Database(process.env.DB_PATH, process.env.NODE_ENV == "production" ? {} : { verbose: console.log });

  try {
    db.exec('CREATE TABLE IF NOT EXISTS share (id TEXT PRIMARY KEY, data TEXT);');
    const sqlinsert = db.prepare('INSERT INTO share (id, data) VALUES (@id, @data)');

    const insertInto = db.transaction((comp) => {
      sqlinsert.run(comp);
    });
    insertInto(record);

    formatResponseJson({ success: true, id: record.id }, context);
  }
  catch (err) {
    formatResponseJson({ success: false, id: record.id, error: err.message }, context, 500);
  }
  finally {
    db.close();
  }
}

/**
 * Format and send object as a JSON HTTP response. Returns pretty json if ?f=pjson is specified in the request.
 * @param {any} obj Object to be sended in the response
 * @param {any} context HTTP context of the request
 */
function formatResponseJson(obj, context, statusCode = 200) {
  context.res.header("Content-Type", 'application/json');
  context.res.statusCode = statusCode;

  if (context.query && context.query.f && context.query.f == 'pjson')
    context.res.send(JSON.stringify(obj, null, 4));
  else
    context.res.send(obj);
}
