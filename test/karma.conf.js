
var webpackCOnf = require('../scripts/webpack.dev.js');
var webpack = require('webpack');

module.exports = function(config) {
    config.set({
        browsers:   ['Chrome'],
        frameworks: ['jasmine'],
        reporters:  ['mocha'],

        logLevel: config.LOG_INFO,
        autoWatch: false,
        singleRun: true,
        colors: true,
        port: 9876,

        basePath: '',
        files: ['webpack.karma.context.js'],
        preprocessors: { 'webpack.karma.context.js': ['webpack'] },
        exclude: [],
        webpack: webpackCOnf,
        webpackMiddleware: {
            noInfo: true
        }
    });
};