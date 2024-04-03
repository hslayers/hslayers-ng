var webpack = require('webpack');

module.exports = {
  devtool: false,
  plugins: [
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map',
      exclude: ['vendor.js'],
    })
  ],
  output: {
    publicPath: 'auto',
  }
};
