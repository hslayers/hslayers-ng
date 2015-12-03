'use strict';

var hsl_path = '../../';
var gitsha = $.ajax({ type: "GET", url: hsl_path + 'gitsha.js', async: false }).responseText;

require.config({
    urlArgs: 'bust='+gitsha,
    paths: {
        toolbar: hsl_path + 'components/toolbar/toolbar',
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
        panoramio: hsl_path + 'components/layers/panoramio/panoramio',
        core: hsl_path + 'components/core/core',
        WfsSource: hsl_path + 'components/layers/hs.source.Wfs',
        api: hsl_path + 'components/api/api',
        translations: hsl_path + 'components/translations/js/translations'
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
