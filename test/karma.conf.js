const webpackCOnf = require('../scripts/webpack.test.js');
const process = require('process');
process.env.CHROME_BIN = require('puppeteer').executablePath();

module.exports = function (config) {
  config.set({
    browsers: ['ChromeHeadless'],
    frameworks: ['jasmine'],
    reporters: ['mocha'],
    client: {captureConsole: true},
    browserConsoleLogOptions: {
      level: 'log',
      format: '%b %T: %m',
      terminal: true,
    },
    logLevel: config.LOG_INFO,
    autoWatch:
      typeof process.env.watch == 'undefined' ? false : process.env.watch,
    singleRun:
      typeof process.env.watch == 'undefined' ? true : !process.env.watch,
    colors: true,
    port: 9876,

    basePath: '',
    files: ['webpack.karma.context.ts'],
    preprocessors: {'webpack.karma.context.ts': ['webpack']},
    exclude: [],
    webpack: webpackCOnf,
    webpackMiddleware: {
      noInfo: true,
    },
  });
};
