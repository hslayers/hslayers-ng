var webpack = require('webpack');

module.exports = {
  devtool: false,
  plugins: [
      new webpack.SourceMapDevToolPlugin( {
        test: /\.(js|css|jsx|ts|tsx)($|\?)/i,
        noSources: true,
        filename: '[file].map',
      } ) 
  ],
};
