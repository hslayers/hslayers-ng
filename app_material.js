'use strict';
import 'angular-material';
import 'toolbar.module';
import 'print.module';
import 'query.module';
import 'search.module';
import 'measure.module';
import 'permalink.module';
import 'info.module';
import 'datasource-selector.module';
import 'sidebar.module';
import 'add-layers.module';

var module = angular.module('hs', [
    'hs.sidebar',
    'hs.toolbar',
    'hs.layermanager',
    'hs.map',
    'hs.query',
    'hs.search', 'hs.print', 'hs.permalink', 'hs.measure',
    'hs.legend', 'hs.geolocation', 'hs.core',
    'hs.datasource_selector',
    'hs.save-map',
    'hs.addLayers',
    'gettext',
    'hs.compositions',
    'hs.info'
]);

module.directive('hs', ['config', 'Core', function (config, Core) {
    return {
        template: require('hslayers.html'),
        link: function (scope, element, attrs) {
            Core.fullScreenMap(element);
        }
    };
}]);

if (window.hslayersNgConfig) module.value('config', Object.assign({}, window.hslayersNgConfig(ol)));

module.controller('Main', ['$scope', 'Core', 'hs.addLayersWms.service_layer_producer', 'hs.compositions.service_parser', 'config', 'hs.layout.service',
    function ($scope, Core, srv_producer, composition_parser, config, layoutService) {
        $scope.Core = Core;
        layoutService.sidebarRight = false;
        Core.singleDatasources = true;
    }
]);
