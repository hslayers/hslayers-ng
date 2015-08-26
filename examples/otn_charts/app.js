'use strict';

define(['ol', 'toolbar', 'layermanager', 'WfsSource', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'api', 'bootstrap', 'year_selector'],

    function(ol, toolbar, layermanager, WfsSource) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.geolocation',
            'hs.widgets.year_selector'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', '$compile', function(OlMap, Core, $compile) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullscreenMap(element);
                    $("#right-pane", element).append($compile('<div yearselector ng-controller="YearSelector"></div>')(scope));
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

        var src = new ol.source.GeoJSON({
            url: hsl_path + 'examples/otn_charts/shluky.geojson',
            projection: 'EPSG:3857'
        });
        var csrc = new ol.source.Cluster({
            distance: 150,
            source: src
        });

        module.value('default_layers', [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: "Base layer",
                base: true
            }),
            new ol.layer.Vector({
                title: "Accident statistics",
                source: csrc
            })
        ]);

        module.value('default_view', new ol.View({
            center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
            zoom: 4,
            units: "m"
        }));

        module.controller('Main', ['$scope', '$compile', '$element', 'Core', 'hs.map.service', 'default_layers', 'year_selector_service',
            function($scope, $compile, $element, Core, OlMap, default_layers, year_selector_service) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                default_layers[1].setStyle(year_selector_service.style);
                default_layers[1].getSource().on('removefeature', function(f) {
                    if (f.feature.overlay) {
                        OlMap.map.removeOverlay(f.feature.overlay);
                    }
                });
                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
