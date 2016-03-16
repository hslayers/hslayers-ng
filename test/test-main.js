var allTestFiles = [];
var TEST_REGEXP = /(spec|test)\.js$/i;
var hsl_path = './';

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function(file) {
  if (TEST_REGEXP.test(file)) {
    // Normalize paths to RequireJS module names.
    // If you require sub-dependencies of test files to be loaded as-is (requiring file extension)
    // then do not normalize the paths
    var normalizedTestModule = file.replace(/^\/base\/|\.js$/g, '');
    allTestFiles.push(normalizedTestModule);
  }
});

require.config({
  // Karma serves files under /base, which is the basePath from your config file
  baseUrl: '/base',
  paths: {
    compositions: 'components/compositions/compositions',
    measure: 'components/measure/measure',
    app: 'examples/datasources/app',
    code: 'components/core/core',
    angular:  'bower_components/angular/angular',
    ngcookies:  'bower_components/angular-cookies/angular-cookies',
    bootstrap:  'bower_components/bootstrap/dist/js/bootstrap',
    ol: 'node_modules/openlayers/dist/ol',
    drag:  'components/drag/drag',
    map:  'components/map/map',
    styles:  'components/styles/styles',
    'angular-sanitize':  'bower_components/angular-sanitize/angular-sanitize',
    'angular-gettext':  'bower_components/angular-gettext/dist/angular-gettext',
    compositions:  'components/compositions/compositions',
    permalink: 'components/permalink/permalink',
    utils:  'components/utils',
    status_creator:  'components/status_creator/status_creator',
    xml2json:  'bower_components/xml2json/xml2json.min',
    customhtml:   'components/customhtml/customhtml',
    d3: 'bower_components/d3/d3.min',
    proj4:  'bower_components/proj4/dist/proj4',
    crossfilter:  'bower_components/crossfilter/crossfilter.min',
    dc: 'http://cdnjs.cloudflare.com/ajax/libs/dc/1.7.0/dc',
    api: 'components/api/api',
    translations: 'components/translations/js/translations',
    sidebar: 'components/sidebar/sidebar',
    geojson: 'components/layers/hs.source.GeoJSON',
    mobile_toolbar: 'components/mobile_toolbar/mobile_toolbar',
    toolbar: 'components/toolbar/toolbar',
    panoramio: 'components/layers/panoramio/panoramio',
    SparqlJson: 'components/layers/hs.source.SparqlJson',
    sidebar: hsl_path + 'components/sidebar/sidebar',
    bootstrap:  'bower_components/bootstrap/dist/js/bootstrap.min',
    layermanager:  'components/layermanager/layermanager',
    ows:  'components/ows/ows',
    'ows.wms':  'components/ows/ows_wms',
    'ows.nonwms':  'components/ows/ows_nonwms',
    'ows.wmsprioritized':  'components/ows/ows_wmsprioritized',
    query:  'components/query/query',
    search:  'components/search/search',
    print:  'components/print/print',
    permalink:  'components/permalink/permalink',
    lodexplorer:  'components/lodexplorer/lodexplorer',
    geolocation:  'components/geolocation/geolocation',
    measure:  'components/measure/measure',
    legend:  'components/legend/legend',
    core:  'components/core/core',
    SparqlJsonForestry:  'components/layers/hs.source.SparqlJsonForestry',
    api:  'components/api/api',
    translations:  'components/translations/js/translations',
    datasource_selector: 'components/datasource_selector/datasource_selector',
    'angular-mocks': 'bower_components/angular-mocks/angular-mocks',
    WfsSource: hsl_path + 'components/layers/hs.source.Wfs',
    'ows.wfs': hsl_path + 'components/ows/ows_wfs'
      
},
  shim: {
    'angular': {'exports': 'angular'},
    'angular-mocks': ['angular']
  }
  
});

require(['angular-mocks'], function() {
    require(allTestFiles, window.__karma__.start);
});
