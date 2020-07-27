/**
 * Webpack production configuration (merged with common config).
 * it overrides webpack.common.js configuration and:
 * - Set mode to production (allow to minify css, js etc...)
 * - Add content hash to files name -> This way, each time bundled files content changed, file name will be different.
 *   This allow browsers to keep cached files which did not change
 * - Minify/Uglify JS and CSS files
 * - Split js into two bundles: vendors (js comming from node_modules) and bundle (our own js)
 *   This way, when we change our js, only our bundle is changed so browsers can keep vendors js in cache
 * - Allow Load css files (import './myCssFile.css') -> Css rules will be automatically added to index.html into a <style></style> tag.
 * - Allow to load fonts and images (import './myFont.eot'; import './someImage.jpg')
 * - Allow to load html angularjs partials (i.e all html files under src folder) as url ->
 *
 */
const {merge} = require('webpack-merge');
const common = require('./webpack.common');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  output: {
    // Add a chunkhash to file name so it will not be cached by browsers when content changed
    filename: 'hslayers-ng.[name].js',
    path: path.resolve(__dirname, '../dist'),
    library: 'hslayers-ng',
    libraryTarget: 'umd',
  },
  plugins: [],
  optimization: {
    usedExports: true,
    minimizer: [
      // JS minifier/uglifier
      new TerserPlugin({
        parallel: true,
        sourceMap: true,
        // Remove comments as well
        terserOptions: {output: {comments: false}},
      }),
      // CSS minifier
      new OptimizeCSSAssetsPlugin({
        cssProcessorPluginOptions: {
          preset: ['default', {discardComments: {removeAll: true}}],
        },
      }),
    ],
  },
  module: {
    rules: [
      // CSS files are bundled togethers
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              // We do not yet use Modular CSS, hence it's safe to disable their resolving
              modules: false,
            },
          },
        ],
      },
      {
        test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: ['url-loader'],
      },
      // Load images as URLs
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: 'url-loader',
          },
        ],
      },
      // AngularJS templates are cached using cache template
      {
        test: /\.html$/,
        exclude: path.resolve(__dirname, '../src/index.html'),
        use: [
          {
            loader: 'html-loader',
            options: {
              minimize: {
                removeComments: false,
                collapseWhitespace: false,
                caseSensitive: true,
              },
            },
          },
        ],
      },
    ],
  },
});
