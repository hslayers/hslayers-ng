#!/usr/bin/env node
require('dotenv').config();
const yargs = require('yargs');
const path = require('path');
const fs = require("fs");

let envExists = fs.existsSync('.env');
if (!envExists)
  console.warn('\x1b[33m%s\x1b[0m', 'No .env file found! You will need to create one to configure your services.');
if (!process.env.DB_PATH)
  process.env.DB_PATH = 'data/hslayers-server.db';
let dbdir = path.dirname(process.env.DB_PATH);
if (!fs.existsSync(dbdir)) {
  fs.mkdirSync(dbdir);
}

const argv = yargs
  .option('proxy', {
    alias: 'p',
    description: 'Execute proxy service',
    type: 'boolean',
    default: true
  })
  .option('share', {
    alias: 's',
    description: 'Execute map share service',
    type: 'boolean',
    default: true
  })
  .option('layman', {
    alias: 'l',
    description: 'Execute Layman client service',
    type: 'boolean',
    default: false
  })
  .help()
  .alias('help', 'h').argv;

if (argv.proxy) {
  require('./src/proxy');
}
if (argv.share) {
  require('./src/share');
}
if (argv.layman) {
  if (!envExists)
    console.error('\x1b[41m%s\x1b[0m', 'Cannot run Layman client without .env configuration!');
  else
    require('./src/layman');
}
