'use strict';

define(['angular', 'ol', 'toolbar', 'layermanager', 'sidebar', 'map', 'ows', 'query', 'search', 'print', 'permalink', 'measure', 'legend', 'bootstrap.bundle', 'geolocation', 'core', 'datasource_selector', 'api', 'angular-gettext', 'translations', 'compositions', 'status_creator', 'info'],

    function(angular, ol, toolbar, layermanager) {
        var module = angular.module('hs', [
            'hs.sidebar',
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink', 'hs.measure',
            'hs.legend', 'hs.geolocation', 'hs.core',
            'hs.datasource_selector',
            'hs.status_creator',
            'hs.api',
            'hs.ows',
            'gettext',
            'hs.compositions',
            'hs.info'
        ]);

        module.directive('hs', ['config', 'Core', function(config, Core) {
            return {
                template: require('hslayers.html'),
                link: function(scope, element, attrs) {
                    Core.fullScreenMap(element);
                }
            };
        }]);

        if(window.hslayersNgConfig) module.value('config', Object.assign({}, window.hslayersNgConfig(ol)));

        module.controller('Main', ['$scope', 'Core', 'hs.ows.wms.service_layer_producer', 'hs.compositions.service_parser', 'config',
            function($scope, Core, srv_producer, composition_parser, config) {
                $scope.hsl_path = config.hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.sidebarRight = false;
                Core.singleDatasources = true;
            }
        ]);

        return module;
    });