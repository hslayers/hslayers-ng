'use strict';

define(['ol', 'proj4', 'toolbar', 'layermanager', 'sidebar', 'ows', 'query', 'search', 'print', 'permalink', 'lodexplorer', 'measure', 'legend', 'panoramio', 'bootstrap', 'geolocation', 'api'],

    function(ol, toolbar, layermanager) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.ows',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink', 'hs.lodexplorer', 'hs.measure',
            'hs.legend', 'hs.panoramio', 'hs.geolocation', 'hs.api', 'hs.sidebar'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', function(OlMap, Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullScreenMap(element);
                }
            };
        }]);

        module.value('config', {
            box_layers: [
                new ol.layer.Group({
                    'img': 'osm.png',
                    title: 'Base layer',
                    layers: [
                        new ol.layer.Tile({
                            source: new ol.source.OSM(),
                            title: "OpenStreetMap",
                            base: true,
                            visible: true
                        }),
                        new ol.layer.Tile({
                            title: "OpenCycleMap",
                            visible: false,
                            base: true,
                            source: new ol.source.OSM({
                                url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
                            })
                        })
                    ],
                }), new ol.layer.Group({
                    'img': 'armenia.png',
                    title: 'WMS layers',
                    layers: [
                        new ol.layer.Tile({
                            title: "Swiss",
                            source: new ol.source.TileWMS({
                                url: 'http://wms.geo.admin.ch/',
                                params: {
                                    LAYERS: 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png; mode=8bit"
                                },
                                crossOrigin: null
                            }),
                        })
                    ]
                })
            ],
            default_view: new ol.View({
                center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 4,
                units: "m"
            })
        });

        module.controller('Main', ['$scope', 'Core', 'hs.ows.wms.service_layer_producer', 'hs.query.service_infopanel', 'config',
            function($scope, Core, srv_producer, InfoPanelService, config) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                srv_producer.addService('http://erra.ccss.cz/geoserver/ows', config.box_layers[1]);

                $scope.$on('infopanel.updated', function(event) {
                    if (console) console.log('Attributes', InfoPanelService.attributes, 'Groups', InfoPanelService.groups);
                });
            }
        ]);

        return module;
    });
