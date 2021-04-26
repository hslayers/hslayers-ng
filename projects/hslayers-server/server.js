#!/usr/bin/env node
require('dotenv').config();

const path = require('path');
const fs = require("fs");
if (!process.env.DB_PATH)
  process.env.DB_PATH = 'data/hslayers-server.db';
let dbdir = path.dirname(process.env.DB_PATH);
if (!fs.existsSync(dbdir)) {
  fs.mkdirSync(dbdir);
}

require('./src/proxy');
require('./src/share');
require('./src/layman');
