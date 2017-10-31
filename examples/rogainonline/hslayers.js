'use strict';

var hsl_path = '../../';
var gitsha = $.ajax({
    type: "GET",
    url: hsl_path + 'gitsha.js',
    async: false
}).responseText;

require.config({
    urlArgs: 'bust=' + gitsha,
    paths: {
        toolbar: hsl_path + 'components/toolbar/toolbar',
        layermanager: hsl_path + 'components/layermanager/layermanager',
        map: hsl_path + 'components/map/map',
        ows: hsl_path + 'components/ows/ows',
        'ows.wms': hsl_path + 'components/ows/ows_wms',
        'ows.wfs': hsl_path + 'components/ows/ows_wfs',
        'ows.nonwms': hsl_path + 'components/ows/ows_nonwms',
        'ows.wmsprioritized': hsl_path + 'components/ows/ows_wmsprioritized',
        query: hsl_path + 'components/query/query',
        search: hsl_path + 'components/search/search',
        print: hsl_path + 'components/print/print',
        permalink: hsl_path + 'components/permalink/permalink',
        geolocation: hsl_path + 'components/geolocation/geolocation',
        measure: hsl_path + 'components/measure/measure',
        legend: hsl_path + 'components/legend/legend',
        app: 'app',
        core: hsl_path + 'components/core/core',
        api: hsl_path + 'components/api/api',
        translations: hsl_path + 'components/translations/js/translations',
        cesium: hsl_path + 'components/cesium/cesium',
        cesiumjs: hsl_path + '/bower_components/cesium.js/dist/Cesium',
        pois: 'poi',
        olus: 'olu',
        stations: 'stations',
        character: 'character'
    },
    shim: {
        cesiumjs: {
            exports: 'Cesium'
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
