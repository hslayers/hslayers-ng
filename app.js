'use strict';

define(['angular', 'toolbar', 'ol', 'layermanager', 'map', 'ows', 'query', 'search', 'print', 'permalink', 'lodexplorer', 'measure', 'legend'],

    function(angular, toolbar, oj, layermanager) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.ows',
            'hs.query',
            'hs.search',
            'hs.print',
            'hs.permalink',
            'hs.lodexplorer',
            'hs.measure',
            'hs.legend'
        ]);

        module.directive('hs', function() {
            return {
                templateUrl: 'hslayers.html'
            };
        });

        module.value('default_layers', [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: "Base layer"
            })
        ]);

        module.value('default_view', new ol.View({
            center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
            zoom: 4
        }));

        module.controller('Main', ['$scope', 'ToolbarService',
            function($scope, ToolbarService) {
                console.log("Main called");
                $scope.ToolbarService = ToolbarService;
            }
        ]);

        return module;
    });
