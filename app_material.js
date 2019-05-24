'use strict';
import angularMaterial from 'angular-material';

import ol from 'ol';
import toolbar from 'toolbar';
import print from 'print';
import query from 'query';
import search from 'search';
import measure from 'measure';
import permalink from 'permalink';
import info from 'info';
import ds from 'datasource_selector';
import sidebar from 'sidebar';
import ows from 'ows';

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

module.directive('hs', ['config', 'Core', function (config, Core) {
    return {
        template: require('hslayers.html'),
        link: function (scope, element, attrs) {
            Core.fullScreenMap(element);
        }
    };
}]);

if (window.hslayersNgConfig) module.value('config', Object.assign({}, window.hslayersNgConfig(ol)));

module.controller('Main', ['$scope', 'Core', 'hs.ows.wms.service_layer_producer', 'hs.compositions.service_parser', 'config',
    function ($scope, Core, srv_producer, composition_parser, config) {
        $scope.hsl_path = config.hsl_path; //Get this from hslayers.js file
        $scope.Core = Core;
        Core.sidebarRight = false;
        Core.singleDatasources = true;
    }
]);
