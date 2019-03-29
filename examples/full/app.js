'use strict';

define(['angular', 'ol', 'toolbar', 'layermanager', 'sidebar', 'map', 'ows', 'query', 'search', 'print', 'permalink', 'measure', 'legend', 'bootstrap.bundle', 'geolocation', 'core', 'datasource_selector', 'api', 'angular-gettext', 'translations', 'compositions', 'status_creator', 'info'],

    function(angular, ol, toolbar, layermanager) {
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

        module.directive('hs', ['config', 'Core', function(config, Core) {
            return {
                templateUrl: config.hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullScreenMap(element);
                }
            };
        }]);

        module.value('config', {
            open_lm_after_comp_loaded: true,
            layer_order: '-position',
            box_layers: [
                new ol.layer.Group({
                    'img': 'osm.png',
                    title: 'Base layer',
                    layers: [
                        new ol.layer.Tile({
                            source: new ol.source.OSM(),
                            title: "OpenStreetMap",
                            base: true,
                            visible: true,
                            removable: false
                        }),
                        new ol.layer.Tile({
                            title: "OpenCycleMap",
                            visible: false,
                            base: true,
                            source: new ol.source.OSM({
                                url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
                            })
                        }),
                        new ol.layer.Tile({
                            title: "Satellite",
                            visible: false,
                            base: true,
                            source: new ol.source.XYZ({
                                url: 'http://api.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicmFpdGlzYmUiLCJhIjoiY2lrNzRtbGZnMDA2bXZya3Nsb2Z4ZGZ2MiJ9.g1T5zK-bukSbJsOypONL9g'
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
                                crossOrigin: "anonymous"
                            }),
                        }),
                        new ol.layer.Tile({
                            title: "Ilida plastics kg/ha per year",
                            source: new ol.source.TileWMS({
                                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/ilida/ilida.map',
                                params: {
                                    LAYERS: 'ilida_cultivation_plastics',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png",
                                    ABSTRACT: "Plastic waste in Ilida municipality"
                                },
                                crossOrigin: "anonymous"
                            }),
                            path: 'Ilida Thematic Data',
                            visible: true,
                            opacity: 0.8
                        }),
                        new ol.layer.Tile({
                            title: "Výnosový potenciál",
                            source: new ol.source.TileWMS({
                                url: 'http://foodie-data.wirelessinfo.cz/geoserver-hsl/kojcice/wms?',
                                params: {
                                    LAYERS: 'kojcice_vynospot_5m_poly',
                                    //INFO_FORMAT: undefined,
                                    INFO_FORMAT: 'text/html',
                                    FORMAT: "image/png"
                                },
                                crossOrigin: "anonymous"
                            }),
                            path: 'Kojčice',
                            visible: true,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Aplikační pásma dle výnosového potenciálu",
                            source: new ol.source.TileWMS({
                                url: 'http://foodie-data.wirelessinfo.cz/geoserver-hsl/kojcice/wms?',
                                params: {
                                    LAYERS: 'kojcice_vra_n1_pole_viper',
                                    //INFO_FORMAT: undefined,
                                    INFO_FORMAT: 'text/html',
                                    FORMAT: "image/png"
                                },
                                crossOrigin: "anonymous"
                            }),
                            path: 'Kojčice',
                            visible: true,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "Půdní typ",
                            source: new ol.source.TileWMS({
                                url: 'http://foodie-data.wirelessinfo.cz/geoserver-hsl/kojcice/wms?',
                                params: {
                                    LAYERS: 'pudni_typy_verze3',
                                    //INFO_FORMAT: undefined,
                                    INFO_FORMAT: 'text/html',
                                    FORMAT: "image/png"
                                },
                                crossOrigin: "anonymous"
                            }),
                            path: 'Kojčice',
                            visible: true,
                            opacity: 0.5
                        }),
                        new ol.layer.Tile({
                            title: "LPIS",
                            source: new ol.source.TileWMS({
                                url: 'http://foodie-data.wirelessinfo.cz/geoserver-hsl/kojcice/wms?',
                                params: {
                                    LAYERS: 'lpis_zdkojcice',
                                    //INFO_FORMAT: undefined,
                                    INFO_FORMAT: 'text/html',
                                    FORMAT: "image/png"
                                },
                                crossOrigin: "anonymous"
                            }),
                            path: 'Kojčice',
                            visible: true,
                            opacity: 0.5
                        })
                    ]
                })
            ],
            default_view: new ol.View({
                center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 4,
                units: "m"
            }),
            hostname: {
                "default": {
                    "title": "Default",
                    "type": "default",
                    "editable": false,
                    "url": 'http://www.whatstheplan.eu'
                }
            },
            compositions_catalogue_url: '/p4b-dev/cat/catalogue/libs/cswclient/cswClientRun.php',
            status_manager_url: '/wwwlibs/statusmanager2/index.php',
            datasources: [{
                title: "SuperCAT",
                url: "http://cat.ccss.cz/csw/",
                language: 'eng',
                type: "micka",
                code_list_url: 'http://www.whatstheplan.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
            }]
        });

        module.controller('Main', ['$scope', 'Core', 'hs.ows.wms.service_layer_producer', 'hs.compositions.service_parser', 'config',
            function($scope, Core, srv_producer, composition_parser, config) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.sidebarRight = false;
                Core.singleDatasources = true;
                srv_producer.addService('http://erra.ccss.cz/geoserver/ows', config.box_layers[1]);
            }
        ]);

        return module;
    });
