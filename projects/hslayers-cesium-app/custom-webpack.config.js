var webpack = require('webpack');

module.exports = {
  devtool: false,
  node: {
    // Resolve node module use of fs
    fs: "empty",
    Buffer: false,
    http: "empty",
    https: "empty",
    zlib: "empty",
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
