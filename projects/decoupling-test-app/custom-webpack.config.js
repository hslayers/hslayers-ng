var webpack = require('webpack');

module.exports = {
  devtool: false,
  plugins: [
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map',
      exclude: ['vendor.js'],
    }),
    // new webpack.optimize.LimitChunkCountPlugin({
    //   maxChunks: 25,
    // }),
    new webpack.optimize.MinChunkSizePlugin({
      minChunkSize: 50000, // Minimum number of characters
    })
  ],
};
