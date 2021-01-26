require('dotenv').config();

const express = require('express');
//const cors = require('cors');
const { MongoClient } = require("mongodb");
const share = express();

// parse incoming POST requests body to JSON
share.use(express.json());
//// handle CORS
//share.use(cors())
share.set('view engine', 'pug')


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

      default:
        formatResponseJson({ success: false, error: "Request not specified" }, context);
        break;
    }
  }
  else {
    context.res.send('HSLayers map share service');
  }
});

// handle POST requests
share.post('/', context => {
  if (context.body && context.body.request) {
    switch (context.body.request.toLowerCase()) {
      case 'save':
        insertRecord("composition", {
          id: context.body.id,
          data: context.body.data
        }, context);
        break;

      case 'socialshare':
        insertRecord("socialShare", {
          id: context.body.id,
          url: context.body.url,
          title: context.body.title,
          description: context.body.description,
          image: context.body.image
        }, context);
        break;

      default:
        formatResponseJson({ success: false, error: "Request not specified" }, context);
    }
  }
  else {

  }
});

// start the service on the port xxxx
share.listen(3000, () => console.log('HSLayers map share service listening on port 3000...'));


/**
 * Find composition by its ID and return it as JSON
 * @param {any} id ID of the composition to look for
 * @param {any} context HTTP context of the request
 */
async function getCompositionRecord(id, context) {
  await queryCollection("composition", { id: id }, function (result, success) {
    if (success)
      formatResponseJson({ success: true, id: result.id, data: result.data }, context);
    else
      formatResponseJson(result, context);
  });
}

/**
 * Find composition social share record by its ID and render it as HTML
 * @param {any} id ID of the composition to look for
 * @param {any} context HTTP context of the request
 */
async function getSocialShareRecord(id, context) {
  await queryCollection("socialShare", { id: id }, function (result, success) {
    if (success)
      context.res.render('socialShare', { record: result });
    else
      formatResponseJson(result, context);
  });
}

/**
 * Generic method to find an item in the DB collection
 * @param {any} collName Name of the collection
 * @param {any} query MongoDB query expression
 * @param {any} callback Callback function
 */
async function queryCollection(collName, query, callback) {
  const client = new MongoClient(process.env.DB_HOST, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection(collName);
    const result = await collection.findOne(query);

    if (result) {
      callback(result, true);
    }
    else {
      callback({ success: false, id: query.id, error: `${collName} record not found` }, false);
    }
  }
  catch (err) {
    callback({ success: false, id: query.id, error: err }, false);
  }
  finally {
    client.close();
  }
}

/**
 * Generic method to insert an item in the DB collection
 * @param {any} collName Name of the collection
 * @param {any} record Item to be inserted
 * @param {any} context HTTP context of the request
 */
async function insertRecord(collName, record, context) {
  const client = new MongoClient(process.env.DB_HOST, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection(collName);

    var result = await collection.insertOne(record);
    if (result.insertedCount > 0)
      formatResponseJson({ success: true, id: record.id }, context);
    else
      formatResponseJson({ success: false, id: record.id, error: err }, context);
  }
  catch (err2) {
    formatResponseJson({ success: false, id: record.id, error: err2 }, context);
  }
  finally {
    client.close();
  }
}

/**
 * Format and send object as a JSON HTTP response
 * @param {any} obj Object to be sended in the response
 * @param {any} context HTTP context of the request
 */
function formatResponseJson(obj, context) {
  context.res.header("Content-Type", 'application/json');

  if (context.query && context.query.f && context.query.f == 'pjson')
    context.res.send(JSON.stringify(obj, null, 4));
  else
    context.res.send(obj);
}
