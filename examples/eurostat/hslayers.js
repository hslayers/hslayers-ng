'use strict';

var hsl_path = '../../';
require.config({
    paths: {
        toolbar: hsl_path + 'components/toolbar/toolbar',
        ol: hsl_path + 'lib/ol3/ol-debug',
        layermanager: hsl_path + 'components/layermanager/layermanager',
        ows: hsl_path + 'components/ows/ows',
        'ows.wms': hsl_path + 'components/ows/ows_wms',
        'ows.nonwms': hsl_path + 'components/ows/ows_nonwms',
        'ows.wmsprioritized': hsl_path + 'components/ows/ows_wmsprioritized',
        query: hsl_path + 'components/query/query',
        search: hsl_path + 'components/search/search',
        print: hsl_path + 'components/print/print',
        permalink: hsl_path + 'components/permalink/permalink',
        lodexplorer: hsl_path + 'components/lodexplorer/lodexplorer',
        geolocation: hsl_path + 'components/geolocation/geolocation',
        measure: hsl_path + 'components/measure/measure',
        legend: hsl_path + 'components/legend/legend',
        app: 'app',
        xml2json: hsl_path + 'lib/xml2json.min',
        panoramio: hsl_path + 'components/panoramio/panoramio',
        d3: hsl_path + 'lib/d3.v3.min',
        crossfilter: hsl_path + 'lib/crossfilter.v1.min',
        dc: 'http://cdnjs.buttflare.com/ajax/libs/dc/1.7.0/dc',
        core: hsl_path + 'components/core/core',
        api: hsl_path + 'components/api/api',
        translations: hsl_path + 'components/translations/js/translations'
   },
    shim: {
        d3: {
            exports: 'd3'
        },
        dc: {
            deps: ['d3', 'crossfilter']
        }
    }
});

window.name = "NG_DEFER_BOOTSTRAP!";

require(['core'], function(app) {
    require(['app'], function(app) {
        var $html = angular.element(document.getElementsByTagName('html')[0]);
        angular.element().ready(function() {
            angular.resumeBootstrap([app['name']]);
        });
    });
});

