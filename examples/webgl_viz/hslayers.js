'use strict';

var hsl_path = '../../';

var gitsha = $.ajax({
    type: "GET",
    url: hsl_path + 'gitsha.js',
    async: false
}).responseText;
var jans_path = 'http://home.zcu.cz/~jezekjan/webglayer-snaphsot1_1/js/'; //http://localhost:9999/js/webglayer/js/
//  var jans_path = 'http://localhost:9999/js/webglayer/js/'



//var jans_path = 'http://localhost:9999/js/webglayer/js/';

//https://github.com/tnajdek/angular-requirejs-seed
require.config({
    urlArgs: 'bust=' + gitsha,
    paths: {
        toolbar: hsl_path + 'components/toolbar/toolbar',
        permalink: hsl_path + 'components/permalink/permalink',
        sidebar: hsl_path + 'components/sidebar/sidebar',
        layermanager: hsl_path + 'components/layermanager/layermanager',
        map: hsl_path + 'components/map/map',
        search: hsl_path + 'components/search/search',
        app: 'app',
        xml2json: hsl_path + 'lib/xml2json.min',
        core: hsl_path + 'components/core/core',
        api: hsl_path + 'components/api/api',
        translations: hsl_path + 'components/translations/js/translations',
        dimension: jans_path + '/Dimension',
        glutils: jans_path + 'GLUtils',
        manager: jans_path + 'Manager',
        mapcontroller: jans_path + 'MapController',
        heatmapdimension: jans_path + 'HeatMapDimension',
        mapdimension: jans_path + 'MapDimension',
        stackedbarchart: jans_path + 'StackedBarChart',
        histogramdimension: jans_path + 'HistDimension',
        floatrasterreader: jans_path + 'FloatRasterReader',
        floatreaderhistogram: jans_path + 'FloatReaderHistogram',
        heatmaprenderer: jans_path + 'HeatMapRenderer',
        heatmaplegend: jans_path + 'HeatMapLegend',
        maxcalculator: jans_path + 'MaxCalculator',
        linearfilter: jans_path + 'LinearFilter',
        extentfilter: jans_path + 'ExtentFilter',
        mappolyfilter: jans_path + 'MapPolyFilter',
        multibrush: jans_path + 'd3.svg.multibrush',
        WGL: jans_path + 'WGL',
        filter: jans_path + 'Filter',
        poly2tri: 'http://home.zcu.cz/~jezekjan/js/poly2tri',
        dataloader: 'DataLoader',
        ol: hsl_path + 'lib/ol3/ol-full',
        wglinit: 'webglinit',
        mapConf: 'mapconf',
        chart_panel: hsl_path + 'examples/webgl_viz/chart_panel/chart_panel'
    },
    shim: {
        d3: {
            exports: 'd3'
        },
        poly2tri: {
            exports: 'poly2tri'
        },
        multibrush: {
            deps: ['d3']
        }
    }

});

//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
window.name = "NG_DEFER_BOOTSTRAP!";

require(['core'], function(app) {

    require(['app'], function(app) {
        var $html = angular.element(document.getElementsByTagName('html')[0]);
        angular.element().ready(function() {
            angular.resumeBootstrap([app['name']]);
        });
    });
});
