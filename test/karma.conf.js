// Karma configuration
// Generated on Sun Mar 06 2016 16:01:13 GMT+0200 (EET)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../',
    plugins: [
        'karma-chrome-launcher',
        'karma-jasmine',
        'karma-requirejs'
    ],

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'requirejs'],
    

    // list of files / patterns to load in the browser
    files: [
      'bower_components/jquery/dist/jquery.js',
      {pattern:'bower_components/angular/angular.js', included: false},
      {pattern:'bower_components/proj4/dist/proj4.js', included: false},
      {pattern:'bower_components/angular-gettext/dist/angular-gettext.js', included: false},
      {pattern:'bower_components/bootstrap/dist/js/bootstrap.min.js', included: false},
      {pattern:'bower_components/angular-sanitize/angular-sanitize.js', included: false},
      {pattern:'bower_components/angularjs-socialshare/dist/angular-socialshare.js', included: false},
      {pattern:'bower_components/angular-cookies/angular-cookies.js', included: false},
      {pattern:'bower_components/d3/d3.min.js', included: false},
      {pattern:'bower_components/angular-drag-and-drop-lists/angular-drag-and-drop-lists.js', included: false},
      'test/test-main.js',
      {pattern: 'test/unit/**/*.js', included: false},
      {pattern: 'components/**/*.js', included: false},
      {pattern: 'examples/datasources/app.js', included: false},
      {pattern: 'node_modules/openlayers/dist/ol.js', included: false},
      {pattern: 'bower_components/angular-mocks/angular-mocks.js', included: false}
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
