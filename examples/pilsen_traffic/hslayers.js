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
        ngtimeline: hsl_path + 'node_modules/angular-timelinejs3/dist/js/ng-timeline',
        //Full
        //timeline: hsl_path + 'node_modules/TimelineJS3/compiled/js/timeline',
        //lazyimage: hsl_path + 'node_modules/angular-lazy-image/dist/lazy-image',
        //Min
        timeline: 'https://cdn.knightlab.com/libs/timeline3/latest/js/timeline',
        lazyimage: hsl_path + 'node_modules/angular-lazy-image/dist/lazy-image.min'
    },
    shim: {
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

//IE9 requestAnimationFrame polyfill
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
