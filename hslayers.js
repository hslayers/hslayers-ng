'use strict';

//https://github.com/tnajdek/angular-requirejs-seed
require.config({
        paths: {
               angular: 'bower_components/angular/angular',
               toolbar: 'components/toolbar/toolbar',
               layermanager: 'components/layermanager/layermanager',
               map: 'components/map/map',
               ol: 'http://ol3js.org/en/master/build/ol-debug',
               ows: 'components/ows/ows', 
               'ows.wms': 'components/ows/ows_wms', 
               'ows.nonwms': 'components/ows/ows_nonwms', 
               'ows.wmsprioritized': 'components/ows/ows_wmsprioritized',
               query: 'components/query/query', 
               search: 'components/search/search', 
               print: 'components/print/print', 
               permalink: 'components/permalink/permalink', 
               lodexplorer: 'components/lodexplorer/lodexplorer', 
               measure: 'components/measure/measure', 
               legend: 'components/legend/legend',
               xml2json:'lib/xml2json.min'
        },
        shim: {
                'angular' : {'exports' : 'angular'},
        },
        priority: [
                "angular"
        ]
});

//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
window.name = "NG_DEFER_BOOTSTRAP!";

require( [
        'angular',
        'ol',
        'app'
], function(angular, ol, app) {
        var $html = angular.element(document.getElementsByTagName('html')[0]);
        angular.element().ready(function() {
                angular.resumeBootstrap([app['name']]);
        });
});