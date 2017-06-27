'use strict';

var hsl_path = '../../';
if(window.location.hostname.indexOf('intenzitadopravy.plzen.eu')>-1)
    hsl_path = './';

var hslMin = true;

var pilsenSite = false;
if(window.location.hostname.indexOf('intenzitadopravy.plzen.eu')>-1) pilsenSite = true;

var gitsha = Math.random(); $.ajax({
    type: "GET",
    dataType: 'text',
    url: hsl_path + 'gitsha.js',
    async: false,
    success: function(r){gitsha = r}
});

require.config({
    urlArgs: 'bust=' + gitsha,
    paths: {
        app: 'app',
        core: hsl_path + 'components/core/core.min',
        pilsentraffic: './pilsentraffic',
        //ol: hsl_path + 'node_modules/openlayers/dist/ol-debug', //Full
        ol: hsl_path + 'node_modules/openlayers/dist/ol', //Min
        calendar: './calendar',
        translations: './translations',
        moment: hsl_path + 'node_modules/moment/min/moment.min',
        ngtimeline: hsl_path + 'bower_components/angular-timelinejs3/dist/js/ng-timeline',
        //Full
        //timeline: hsl_path + 'bower_components/TimelineJS3/compiled/js/timeline',
        //lazyimage: hsl_path + 'bower_components/ng-directive-lazy-image/dist/lazy-image',
        //Min
        timeline: hsl_path + 'bower_components/TimelineJS3/compiled/js/timeline-min',
        lazyimage: hsl_path + 'bower_components/ng-directive-lazy-image/dist/lazy-image.min'
    },
    shim: {
        d3: {
            exports: 'd3'
        },
        dc: {
            deps: ['d3', 'crossfilter']
        },
        s4a: {
            deps: ['ol', 'dc'],
            exports: 's4a'
        },
        ngtimeline: {
            deps: ['timeline']
        },
        lazyimage: {
            deps: ['angular']
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
