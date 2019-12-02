
var webpackCOnf = require('../scripts/webpack.dev.js');
var webpack = require('webpack');
const process = require('process');
process.env.CHROME_BIN = require('puppeteer').executablePath()

module.exports = function(config) {
    config.set({
        browsers:   ['ChromeHeadless'],
        frameworks: ['jasmine'],
        reporters:  ['mocha'],

        logLevel: config.LOG_INFO,
        autoWatch: typeof process.env.watch == 'undefined' ? false :  process.env.watch,
        singleRun: typeof process.env.watch == 'undefined' ? true : !process.env.watch,
        colors: true,
        port: 9876,

        basePath: '',
        files: ['webpack.karma.context.js'],
        preprocessors: { 'webpack.karma.context.js': ['webpack', 'sourcemap'] },
        exclude: [],
        webpack: webpackCOnf,
        webpackMiddleware: {
            noInfo: true
        }
    });
};