/**
 * Webpack development configuration (merged with common one).
 * it overrides the webpack.common.js configuration and:
 * - Set mode to development -> This mode is used by some plugins and webpack to prevent minifying assets etc...
 * - Generates a sourcemap of bundled code -> Allow to easily debug js code (do not use in prod)
 * - Remove some bundling optimization to speed it up
 */
const {merge} = require('webpack-merge');
const common = require('./webpack.common');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const fs = require('fs');

const scssOverridesPath = '../apps/simple/';

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  watchOptions: {ignored: /node_modules/},
  externals: [
    nodeExternals({
      allowlist: ['bootstrap'],
    }),
  ],
  optimization: {
    // see https://webpack.js.org/guides/build-performance#avoid-extra-optimization-steps
    removeAvailableModules: false,
    removeEmptyChunks: false,
    // In dev mode we simply want to get a big bundle containing all our js
    splitChunks: false,
  },
  module: {
    rules: [
      // Load css files which will be injected in html page at startup <style>...</style>)
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            // We do not yet use Modular CSS, hence it's safe to disable their resolving
            options: {
              modules: false,
            },
          },
        ],
      },
      //SCSS files
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              additionalData: fs.existsSync(scssOverridesPath + 'hsl-custom.scss')
                ? `@use "${scssOverridesPath}hsl-custom.scss" as *;`
                : '',
            },
          },
        ],
      },
      {
        test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: ['url-loader'],
      },
      // Load angularJS partials HTML file as URL
      {
        test: /\.html$/,
        exclude: path.resolve(__dirname, '../src/index.html'),
        use: ['html-loader'],
      },
      // Load images as URLs
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: {
          loader: 'url-loader',
        },
      },
    ],
  },
});
