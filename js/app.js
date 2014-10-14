'use strict';

angular.module('hs', [
    'ngRoute',
    'hs.layermanager',
    'hs.map',
    'hs.ows',
    'hs.query',
    'hs.search',
    'hs.print',
    'hs.permalink',
    'hs.lodexplorer',
    'hs.toolbar',
    'hs.measure',
    'hs.legend'
])

.value('default_layers', [
        new ol.layer.Tile({source: new ol.source.OSM(), title: "Base layer"})])

.controller('Main', ['$scope', 'ToolbarService',
    function($scope, ToolbarService) {
       console.log("Main called");
       $scope.ToolbarService = ToolbarService;
    }
])