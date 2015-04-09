'use strict';

define(['ol', 'toolbar', 'layermanager', 'WfsSource', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'api'],

    function(ol, toolbar, layermanager, WfsSource) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.geolocation'
        ]);

        module.directive('hs', ['OlMap', 'Core', '$compile', function(OlMap, Core, $compile) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullscreenMap(element);
                }
            };
        }]);

        module.value('box_layers', []);

        var style = new ol.style.Style({
            image: new ol.style.Circle({
                fill: new ol.style.Fill({
                    color: [242, 121, 0, 0.7]
                }),
                stroke: new ol.style.Stroke({
                    color: [0xbb, 0x33, 0x33, 0.7]
                }),
                radius: 5
            }),
            fill: new ol.style.Fill({
                color: "rgba(139, 189, 214, 0.3)",
            }),
            stroke: new ol.style.Stroke({
                color: '#112211',
                width: 1
            })
        })

        module.value('default_layers', [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: "Base layer",
                box_id: 'osm',
                base: true
            }),
            new ol.layer.Image({
                title: "Traffic accidents",
                source: new ol.source.ImageWMS({
                    url: 'http://otn.bnhelp.cz/cgi-bin/mapserv?map=/data/www/otn.bnhelp.cz/maps/accidents/accidents_wms.map',
                    params: {
                        LAYERS: 'accidents',
                        INFO_FORMAT: "application/vnd.ogc.gml",
                        FORMAT: "image/png; mode=8bit"
                    },
                    crossOrigin: null
                })
            })
        ]);

        module.value('default_view', new ol.View({
            center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
            zoom: 4,
            units: "m"
        }));

        module.controller('Main', ['$scope', '$compile', '$element', 'Core', 'InfoPanelService', 'OlMap', 'default_layers',
            function($scope, $compile, $element, Core, InfoPanelService, OlMap, default_layers) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
