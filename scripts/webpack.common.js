/**
 * Webpack common configuration.
 * it:
 * - Define the app entry point (./src) -> Where webpack will start compiling/bundling
 * - Define where assets will be served at by our webserver  (static/)
 * - Clean previous build on each build
 * - Generates the index.html file automatically by injecting bundled assets in it (css, js)
 * - Allow to load html files as strings in js code (i.e: import htmlString from './myHtmlFile.html)
 * - Allow to automatically generates the dependencies injection for angularJS components annotated with
 *   `'ngInject';` or `@ngInject` in comments. See https://docs.angularjs.org/guide/di
 */
const path = require('path');
const WebpackBuildNotifierPlugin = require('webpack-build-notifier');
const DynamicPubPathPlugin = require('dynamic-pub-path-plugin');
const webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, '../main.ts'),
  output: {
    // Path where bundled files will be output
    path: path.resolve(__dirname, '../dist'),
    filename: 'hslayers-ng.js',
    library: 'hslayers-ng',
    libraryTarget: 'umd',
  },
  // Just for build speed improvement
  resolve: {
    symlinks: true,
    extensions: ['.tsx', '.ts', '.js'],
    modules: [path.join(__dirname, '..'), path.resolve('../node_modules')],
  },
  plugins: [
    new DynamicPubPathPlugin({
      'expression': `(window.HSL_PATH || './node_modules/hslayers-ng/dist/')`,
    }),
    // Clean before build
    //new CleanWebpackPlugin()
    new WebpackBuildNotifierPlugin({
      title: 'HsLayersNg',
      suppressSuccess: false,
    }),
    new webpack.ContextReplacementPlugin(
      // The (\\|\/) piece accounts for path separators in *nix and Windows

      // For Angular 5, see also https://github.com/angular/angular/issues/20357#issuecomment-343683491
      /\@angular(\\|\/)core(\\|\/)fesm5/,
      '../', // location of your src
      {
        // your Angular Async Route paths relative to this root directory
      }
    ),
  ],
  amd: {
    // Enable webpack-friendly use of require in Cesium
    toUrlUndefined: true,
  },
  node: {
    // Resolve node module use of fs
    fs: 'empty',
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: [{loader: 'ng-annotate-loader'}, 'ts-loader'],
        exclude: /node_modules/,
      },
      {test: /\.xml$/, loader: 'raw-loader'},
      {
        // Mark files inside `@angular/core` as using SystemJS style dynamic imports.
        // Removing this will cause deprecation warnings to appear.
        test: /[\/\\]@angular[\/\\]core[\/\\].+\.js$/,
        parser: {system: true}, // enable SystemJS
      },
      // Automatically generates $inject array for angularJS components annotated with:
      // 'ngInject';
      // or commented with /**@ngInject */
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              // Babel syntax dynamic import plugin allow babel to correctly parse js files
              // using webpack dynamic import expression (i.e import('angular').then(...))
              plugins: [
                'angularjs-annotate',
                '@babel/plugin-syntax-dynamic-import',
              ],
            },
          },
        ],
      },
    ],
  },
};
