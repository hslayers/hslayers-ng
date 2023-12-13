var webpack = require('webpack');

module.exports = {
  devtool: false,
  optimization: {
    splitChunks: {
      maxSize: 50000
    }
  },
  plugins: [
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map',
      exclude: ['vendor.js'],
    }),
  ],
};
