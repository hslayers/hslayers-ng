#!/usr/bin/env node
import 'dotenv/config';
import yargs from 'yargs';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

let envExists = existsSync('.env');
if (!envExists)
  console.warn('\x1b[33m%s\x1b[0m', 'No .env file found! You will need to create one to configure your services.');
if (!process.env.DB_PATH)
  process.env.DB_PATH = 'data/hslayers-server.db';
let dbdir = path.dirname(process.env.DB_PATH);
if (!existsSync(dbdir)) {
  mkdirSync(dbdir);
}

const argv = yargs(process.argv.slice(2))
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
  import('./src/proxy.js');
}
if (argv.share) {
  import('./src/share.js');
}
if (argv.layman) {
  if (!envExists)
    console.error('\x1b[41m%s\x1b[0m', 'Cannot run Layman client without .env configuration!');
  else
    import('./src/layman.js');
}
