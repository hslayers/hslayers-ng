var webpack = require('webpack');

module.exports = {
  devtool: false,
  resolve: {
    fallback: {
      fs: false,
      Buffer: false,
      http: false,
      https: false,
      zlib: false,
      url: false
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
