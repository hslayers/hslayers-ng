'use strict';

/*
var hsl_path = '../../../../';
require.config({
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
        app: 'js/app',
        panoramio: hsl_path + 'components/panoramio/panoramio',
        core: hsl_path + 'components/core/core',
        WfsSource: hsl_path + 'extensions/hs.source.Wfs',
        api: hsl_path + 'components/api/api',
        translations: hsl_path + 'components/translations/js/translations'
    }
});
*/

var hsl_path = '';
require.config({
    paths: {
        toolbar: 'components/toolbar/toolbar',
        layermanager: 'components/layermanager/layermanager',
        ows: 'components/ows/ows',
        'ows.wms': 'components/ows/ows_wms',
        'ows.nonwms': 'components/ows/ows_nonwms',
        'ows.wmsprioritized': 'components/ows/ows_wmsprioritized',
        query: 'components/query/query',
        search: 'components/search/search',
        print: 'components/print/print',
        permalink: 'components/permalink/permalink',
        lodexplorer: 'components/lodexplorer/lodexplorer',
        geolocation: 'components/geolocation/geolocation',
        measure: 'components/measure/measure',
        legend: 'components/legend/legend',
        app: 'js/app',
        panoramio: 'components/panoramio/panoramio',
        core: 'components/core/core',
        SparqlJson: hsl_path + 'extensions/hs.source.SparqlJson',
        api: 'components/api/api',
        WfsSource: 'extensions/hs.source.Wfs',
        translations: 'components/translations/js/translations',
        'feature-crossfilter': hsl_path + 'components/feature_crossfilter/f_crossfilter'
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
