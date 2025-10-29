import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export const argv = yargs(hideBin(process.argv))
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
  .option('verbose', {
    alias: 'v',
    description: 'Verbose output',
    type: 'boolean',
    default: false
  })
  .help()
  .alias('help', 'h').argv;

