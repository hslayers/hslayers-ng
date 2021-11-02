var webpack = require('webpack');

module.exports = {
  devtool: false,
  resolve: {
    fallback: {
      fs: false
    },
  },
  module: {
    unknownContextCritical: false,
  },
  plugins: [
    new webpack.SourceMapDevToolPlugin({
      filename: "[file].map",
      exclude: ["vendor.js"],
    }),
  ],
};
