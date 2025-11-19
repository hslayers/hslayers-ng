var webpack = require('webpack');

module.exports = (config, options) => {
  // Only add source maps if Angular config has sourceMap enabled
  if (options.sourceMap !== false) {
    config.plugins.push(
      new webpack.SourceMapDevToolPlugin({
        filename: '[file].map',
        exclude: ['vendor.js'],
      })
    );
  }
  // Ensure publicPath is set
  if (config.output) {
    config.output.publicPath = config.output.publicPath || 'auto';
  }

  return config;
};
