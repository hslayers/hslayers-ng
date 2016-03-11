'use strict';

var hsl_path = './';
var gitsha = $.ajax({
    type: "GET",
    url: hsl_path + 'gitsha.js',
    async: false
}).responseText;
//https://github.com/tnajdek/angular-requirejs-seed
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
        lodexplorer: hsl_path + 'components/lodexplorer/lodexplorer',
        geolocation: hsl_path + 'components/geolocation/geolocation',
        measure: hsl_path + 'components/measure/measure',
        legend: hsl_path + 'components/legend/legend',
        app: 'app',
        panoramio: hsl_path + 'components/panoramio/panoramio',
        drag: hsl_path + 'components/drag/drag',
        core: hsl_path + 'components/core/core',
        'angular-sanitize': hsl_path + 'bower_components/angular-sanitize/angular-sanitize',
        wirecloud: hsl_path + 'components/wirecloud/wirecloud',
        api: hsl_path + 'components/api/api',
        'angular-gettext': hsl_path + 'bower_components/angular-gettext/dist/angular-gettext',
        translations: hsl_path + 'components/translations/js/translations'
    },
    shim: {
        'angular': {
            'exports': 'angular'
        },
        'angular-sanitize': {
            deps: ['angular'],
        },
        d3: {
            exports: 'd3'
        },
        dc: {
            deps: ['d3', 'crossfilter']
        },
        'angular-gettext': {
            deps: ['angular'],
        },
        translations: {
            deps: ['angular-gettext'],
        }
    },
    priority: [
        "angular"
    ]
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

var tmp_data_received = [];
if (typeof MashupPlatform !== 'undefined')
    MashupPlatform.wiring.registerCallback("data_received_slot", function(data) {
        console.log('event before loeaded', tmp_data_received.push(data))
    });
