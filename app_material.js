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

const mainModuleMd = angular.module('hs', [
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

mainModuleMd.directive('hs', ['HsConfig', 'HsCore', function (config, HsCore) {
    return {
        template: require('hslayers.html'),
        link: function (scope, element, attrs) {
            HsCore.fullScreenMap(element);
        }
    };
}]);

if (window.hslayersNgConfig) mainModuleMd.value('HsConfig', Object.assign({}, window.hslayersNgConfig(ol)));

mainModuleMd.controller('Main', ['$scope', 'HsCore', 'hs.addLayersWms.service_layer_producer', 'HsCompositionsParserService', 'HsConfig', 'HsLayoutService',
    function ($scope, HsCore, srv_producer, composition_parser, config, layoutService) {
        $scope.HsCore = HsCore;
        layoutService.sidebarRight = false;
    }
]);
