'use strict';

define(['angular', 'ol', 'sidebar', 'toolbar', 'layermanager', 'map', 'query', 'search', 'print', 'permalink', 'measure', 'legend', 'geolocation', 'core', 'api', 'angular-gettext', 'bootstrap.bundle', 'translations', 'compositions', 'status_creator', 'ows'],

    function (angular, ol, toolbar, layermanager) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink', 'hs.measure',
            'hs.legend', 'hs.geolocation', 'hs.core',
            'hs.api',
            'hs.ows',
            'gettext',
            'hs.compositions', 'hs.status_creator',
            'hs.sidebar'
        ]);

        module.directive('hs', ['config', 'Core', function (config, Core) {
            return {
                templateUrl: config.hsl_path + 'hslayers.html',
                link: function (scope, element) {
                    Core.fullScreenMap(element);
                }
            };
        }]);

        var caturl = "/php/metadata/csw/index.php";

        module.value('config', {
            design: 'md',
            box_layers: [
                new ol.layer.Group({
                    title: 'Podkladové mapy',
                    layers: [
                        new ol.layer.Tile({
                            source: new ol.source.OSM({
                                wrapX: false
                            }),
                            title: "Base layer",
                            base: true
                        }),
                        new ol.layer.Image({
                            title: "Topografická podkladová mapa (šedoškálá)",
                            base: true,
                            visible: true,
                            BoundingBox: [{ crs: "EPSG:3857", extent: [1587156, 6509276, 1735558, 6635340] }],
                            source: new ol.source.ImageWMS({
                                url: 'http://geoportal.kraj-lbc.cz/cgi-bin/mapserv?map=/data/gis/MapServer/projects/wms/zabaged_2017_podklad_wms.map',
                                params: {
                                    LAYERS: 'zabaged',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png",
                                    ABSTRACT: "Topografická podkladová mapa Libereckého kraje (šedoškálá)"
                                },
                                crossOrigin: null
                            }),
                        }),
                        new ol.layer.Image({
                            title: "Topografická podkladová mapa (barevná)",
                            base: true,
                            visible: false,
                            BoundingBox: [{ crs: "EPSG:3857", extent: [1587156, 6509276, 1735558, 6635340] }],
                            source: new ol.source.ImageWMS({
                                url: 'http://geoportal.kraj-lbc.cz/cgi-bin/mapserv?map=/data/gis/MapServer/projects/wms/zabaged_2017_podklad_wms.map',
                                params: {
                                    LAYERS: 'zabaged',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png",
                                    ABSTRACT: "Topografická podkladová mapa Libereckého kraje (barevná)"
                                },
                                crossOrigin: null
                            }),
                        }),
                        new ol.layer.Tile({
                            title: "Ortofoto",
                            base: true,
                            visible: false,
                            BoundingBox: [{ crs: "EPSG:3857", extent: [1587156, 6509276, 1735558, 6635340] }],
                            source: new ol.source.TileWMS({
                                url: 'http://geoportal.kraj-lbc.cz/cgi-bin/mapserv?map=/data/gis/MapServer/projects/wms/orto.map',
                                params: {
                                    LAYERS: 'ortofoto',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png; mode=8bit",
                                    ABSTRACT: "Ortofoto Libereckého kraje"
                                },
                                crossOrigin: null
                            }),
                        }),
                        new ol.layer.Image({
                            title: "Jednoduchá podkladová mapa",
                            base: false,
                            visible: false,
                            removable: false,
                            BoundingBox: [{ crs: "EPSG:3857", extent: [1587156, 6509276, 1735558, 6635340] }],
                            source: new ol.source.ImageWMS({
                                url: 'http://geoportal.kraj-lbc.cz/cgi-bin/mapserv?map=/data/gis/MapServer/projects/wms/atlas/zabaged_2017_wms.map',
                                params: {
                                    LAYERS: 'podkladova_mapa',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png",
                                    ABSTRACT: "Jednoduchá podkladová mapa Libereckého kraje"
                                },
                                crossOrigin: null
                            }),
                        }),


                        new ol.layer.Image({
                            title: "Stínovaný model reliéfu",
                            base: false,
                            visible: false,
                            removable: false,
                            BoundingBox: [{ crs: "EPSG:3857", extent: [1587156, 6509276, 1735558, 6635340] }],
                            source: new ol.source.ImageWMS({
                                url: 'http://geoportal.kraj-lbc.cz/cgi-bin/mapserv?map=/data/gis/MapServer/projects/wms/orto.map',
                                params: {
                                    LAYERS: 'stinovany_relief',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png",
                                    ABSTRACT: "Stínovaný model reliéfu Libereckého kraje"
                                },
                                crossOrigin: null
                            }),
                        }),
                        new ol.layer.Image({
                            title: "Administrativní členění",
                            base: false,
                            visible: true,
                            removable: false,
                            BoundingBox: [{ crs: "EPSG:3857", extent: [1587156, 6509276, 1735558, 6635340] }],
                            source: new ol.source.ImageWMS({
                                url: 'http://geoportal.kraj-lbc.cz/cgi-bin/mapserv?map=/data/gis/MapServer/projects/wms/atlas/administrativni_cleneni.map',
                                params: {
                                    LAYERS: 'administrativni_celky_hranice',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png",
                                    ABSTRACT: "Administrativní členění Libereckého kraje"
                                },
                                crossOrigin: null
                            }),
                        }),
                        new ol.layer.Image({
                            title: "Sídla",
                            base: false,
                            visible: true,
                            removable: false,
                            BoundingBox: [{ crs: "EPSG:3857", extent: [1587156, 6509276, 1735558, 6635340] }],
                            source: new ol.source.ImageWMS({
                                url: 'http://geoportal.kraj-lbc.cz/cgi-bin/mapserv?map=/data/gis/MapServer/projects/wms/atlas/administrativni_cleneni.map',
                                params: {
                                    LAYERS: 'definicni_body_administrativnich_celku',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png",
                                    ABSTRACT: "Administrativní členění Libereckého kraje"
                                },
                                crossOrigin: null
                            }),
                        }),

                    ],
                }),
            ],
            //project_name: 'hslayers',
            project_name: 'Material',
            default_view: new ol.View({
                center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 5,
                units: "m"
            }),
            hostname: {
                "default": {
                    "title": "Default",
                    "type": "default",
                    "editable": false,
                    "url": 'http://atlas.kraj-lbc.cz'
                }, /*,
                "compositions_catalogue": {
                    "title": "Compositions catalogue",
                    "type": "compositions_catalogue",
                    "editable": true,
                    "url": 'http://foodie-dev.wirelessinfo.cz'
                },*/
                "status_manager": {
                    "title": "Status manager",
                    "type": "status_manager",
                    "editable": true,
                    "url": 'http://foodie-dev.wirelessinfo.cz'
                }
            },
            social_hashtag: 'via @opentnet',
            //compositions_catalogue_url: '/p4b-dev/cat/catalogue/libs/cswclient/cswClientRun.php',
            //compositions_catalogue_url: 'http://erra.ccss.cz/php/metadata/csw/index.php',
            //status_manager_url: '/wwwlibs/statusmanager2/index.php',

            'catalogue_url': caturl || '/php/metadata/csw/',
            'compositions_catalogue_url': caturl || '/php/metadata/csw/',
            status_manager_url: '/wwwlibs/statusmanager/index.php',

            createExtraMenu: function ($compile, $scope, element) {
                $scope.uploadClicked = function () {
                    alert("UPLOAD!")
                }
                var el = angular.element("<li class=\"sidebar-item\" ng-click=\"uploadClicked()\" ><a href=\"#\"><span class=\"menu-icon glyphicon icon-cloudupload\"></span><span class=\"sidebar-item-title\">Upload</span></a></li>");
                element.find('ul').append(el);
                $compile(el)($scope);
            }
        });

        module.controller('Main', ['$scope', 'Core', 'hs.query.baseService', 'hs.compositions.service_parser', 'hs.map.service', '$rootScope',
            function ($scope, Core, QueryService, composition_parser, hsMap, $rootScope) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.setMainPanel('composition_browser');
                //composition_parser.load('http://www.whatstheplan.eu/wwwlibs/statusmanager2/index.php?request=load&id=972cd7d1-e057-417b-96a7-e6bf85472b1e');
                $scope.$on('query.dataUpdated', function (event) {
                    if (console) console.log('Attributes', QueryService.data.attributes, 'Groups', QueryService.data.groups);
                });
                
                $rootScope.$on('map.loaded', function () {
                    var oldFn = hsMap.interactions.MouseWheelZoom.handleEvent;
                    hsMap.interactions.MouseWheelZoom.handleEvent = function (e) {
                        var type = e.type;
                        if (type !== "wheel" && type !== "wheel") {
                            return true;
                        }
    
                        if (!e.originalEvent.ctrlKey) {
                            return true
                        }
    
                        oldFn.call(this, e);
                    }
                });
            }
        ]);

        return module;
    });
