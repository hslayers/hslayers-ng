'use strict';

define(['angular', 'ol', 'sidebar', 'toolbar', 'layermanager', 'map', 'query', 'search', 'measure', 'permalink', 'geolocation', 'core', 'api', 'angular-gettext', 'bootstrap', 'translations', 'moveFeature', 'vectorLabel', 'photoStyle'],

    function (angular, ol, toolbar, layermanager) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.measure',
            'hs.geolocation', 'hs.core', 'hs.permalink',
            'hs.api',
            'gettext',
            'hs.sidebar',
            'hs.game.moveFeature', 'hs.game.vectorLabel'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', function (OlMap, Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function (scope, element) {
                    Core.fullScreenMap(element);
                }
            };
        }]);

        var caturl = "/php/metadata/csw/index.php";

        module.value('config', {
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM({
                        wrapX: false
                    }),
                    title: "Base layer",
                    base: true
                }),
                new ol.layer.Vector({
                    title: "Sidla",
                    source: new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: 'data/sidla.geojson'
                    }),
                    path: "Libe"
                }),
                new ol.layer.Vector({
                    title: "Horské kóty",
                    source: new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: 'data/koty.geojson'
                    }),
                    path: "Libe"
                }),
                new ol.layer.Vector({
                    title: "Vodni plochy",
                    source: new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: 'data/plochy.geojson'
                    }),
                    path: "Libe"
                }),
                new ol.layer.Vector({
                    title: "Vodni toky",
                    source: new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: 'data/toky.geojson'
                    }),
                    path: "Libe"
                }),
                new ol.layer.Vector({
                    title: "Chraněná území",
                    source: new ol.source.Vector({
                        format: new ol.format.GeoJSON(),
                        url: 'data/chranene.geojson'
                    }),
                    path: "Libe"
                }),
                new ol.layer.Vector({
                    title: "Frantici",
                    source: new ol.source.Vector({
                        url: 'http://viglino.github.io/ol3-ext/examples/data/fond_guerre.geojson',
                        projection: 'EPSG:3857',
                        format: new ol.format.GeoJSON()
                    }),
                    style: function (feature, resolution) {
                        return [
                            new ol.style.Style
                            ({
                                image: new ol.style.Photo({
                                    src: feature.get("img"),
                                    radius: 20,
                                    kind: 'round',
                                    crop: true,
                                    shadow: true,
                                    onload: function () {
                                        feature.getLayer(hslayers_api.getMap()).changed();
                                    },
                                    stroke: new ol.style.Stroke({
                                        width: 1,
                                        color: '#fff'
                                    })
                                })
                            })
                        ]
                    }
                })
            ],
            project_name: 'game_test',
            default_view: new ol.View({
                center: ol.proj.transform([15.20, 50.82], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 10,
                units: "m"
            }),
            hostname: {
                "default": {
                    "title": "Default",
                    "type": "default",
                    "editable": false,
                    "url": 'http://youth.sdi4apps.eu'
                },
                "compositions_catalogue": {
                    "title": "Compositions catalogue",
                    "type": "compositions_catalogue",
                    "editable": true,
                    "url": 'http://foodie-dev.wirelessinfo.cz'
                },
                "status_manager": {
                    "title": "Status manager",
                    "type": "status_manager",
                    "editable": true,
                    "url": 'http://foodie-dev.wirelessinfo.cz'
                },
            }//,
            //queryPoint: 'notWithin'
        });

        module.controller('Main', ['$scope', 'Core', 'hs.game.moveFeatureService', '$timeout', 'hs.map.service', 'hs.game.vectorLabelService',
            function ($scope, Core, moveFeature, $timeout, OlMap, VectorLabel) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                var timer = $timeout(function () {
                    moveFeature.activate({
                        layers: ['Vodni toky', 'Sidla', 'Horské kóty', 'Frantici']
                    });
                    VectorLabel.createLabels({
                        layer: OlMap.findLayerByTitle('Sidla'),
                        label: 'NAZEV',
                        strokeColor: '#000',
                        width: 3,
                        hideMarker: true,
                        textBaseline: 'ideographic'
                    });
                    VectorLabel.createLabels({
                        layer: OlMap.findLayerByTitle('Chraněná území'),
                        label: 'NAZEV',
                        font: '20px Arial,sans-serif',
                        hideMarker: true,
                        textAlign: 'left'
                    });
                }, 2000);
            }
        ]);

        return module;
    });