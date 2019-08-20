const merge = require('webpack-merge');
const common = require('./webpack.prod');
const path = require('path');

module.exports = merge(common, {
  entry: 'app_material.js',
  output: {
    path: path.resolve(__dirname, 'dist/material'),
    filename: 'hslayers-ng.js',
  }
});
