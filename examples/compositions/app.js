'use strict';

define(['angular', 'ol', 'toolbar', 'layermanager', 'map', 'query', 'search', 'print', 'permalink', 'measure', 'legend', 'geolocation', 'core', 'api', 'angular-gettext', 'translations', 'compositions'],

    function(angular, ol, toolbar, layermanager) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink', 'hs.measure',
            'hs.legend', 'hs.geolocation', 'hs.core',
            'hs.api',
            'gettext',
            'hs.compositions'
        ]);

        module.directive('hs', ['OlMap', 'Core', function(OlMap, Core) {
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
            zoom: 5,
            units: "m"
        }));


        module.controller('Main', ['$scope', 'Core', 'InfoPanelService', 'composition_parser',
            function($scope, Core, InfoPanelService, composition_parser) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                composition_parser.load('http://dev.bnhelp.cz/statusmanager/index.php?request=load&permalink=de_landuse');
                $scope.$on('infopanel.updated', function(event) {
                    if (console) console.log('Attributes', InfoPanelService.attributes, 'Groups', InfoPanelService.groups);
                });
            }
        ]);

        return module;
    });
