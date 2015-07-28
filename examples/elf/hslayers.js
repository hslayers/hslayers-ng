'use strict';

var hsl_path = '../../';
require.config({
    paths: {
        layermanager: hsl_path + 'components/layermanager/layermanager',
        ows: hsl_path + 'components/ows/ows',
        ol: hsl_path + 'lib/ol3/ol-debug',
        toolbar: hsl_path + 'components/toolbar/toolbar',
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
        panoramio: hsl_path + 'components/panoramio/panoramio',
        core: hsl_path + 'components/core/core',
        WfsSource: hsl_path + 'extensions/hs.source.Wfs',
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
