/**
 * Webpack production configuration (merged with common config).
 * it overrides webpack.common.js configuration and:
 * - Set mode to production (allow to minify css, js etc...)
 * - Minify/Uglify JS and CSS files
 * - Split js into two bundles: vendors (js comming from node_modules) and main (our own js) + bundle
 *  for each of the UI frameworks (bootstrap and material)
 *   This way, when we change our js, only our bundle is changed so browsers can keep vendors js in cache
 *
 */
const {merge} = require('webpack-merge');
const common = require('./webpack.common');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: 'hslayers-ng.[name].js',
    path: path.resolve(__dirname, '../bundle'),
    library: 'hslayers-ng',
    libraryTarget: 'umd',
  },
  plugins: [
    new webpack.SourceMapDevToolPlugin({
      filename: 'hslayers-ng.[name].js.map',
      exclude: [
        'hslayers-ng.vendors~lazy-material.js',
        'hslayers-ng.vendors~lazy-bootstrap.js',
        'hslayers-ng.vendors.js',
        'hslayers-ng.vendors~img.js',
      ],
    }),
  ],
  optimization: {
    namedChunks: true,
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'initial',
          name: 'vendors',
          enforce: true,
        },
      },
    },
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
