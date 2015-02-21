'use strict';

define(['angular', 'ol', 'toolbar', 'layermanager', 'core', 'map', 'query', 'search', 'print', 'permalink', 'lodexplorer', 'measure', 'geolocation', 'api'],

    function(angular, ol, toolbar, layermanager) {
        var module = angular.module('hs', [
            'hs.core',
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink', 'hs.lodexplorer',
            'hs.geolocation',
            'hs.api'
        ]);

        module.directive('hs', ['OlMap', '$window', function(OlMap, $window) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                	Core.fullscreenMap(element);
                }
            };
        }]);
        
        module.value('box_layers', []);

        module.value('default_layers', [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: "Base layer",
                box_id: 'osm',
                base: true
            })
        ]);

        module.value('default_view', new ol.View({
            center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
            zoom: 4,
            units: "m"
        }));

        module.controller('Main', ['$scope', 'Core', 'InfoPanelService',
            function($scope, Core, InfoPanelService) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                $scope.$on('infopanel.updated', function(event) {
                });
            }
        ]);

        return module;
    });