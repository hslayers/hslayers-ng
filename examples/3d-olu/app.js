'use strict';

define(['ol', 'toolbar', 'layermanager', 'geojson', 'sidebar', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'api', 'cesium', 'ows', 'datasource_selector', 'cesiumjs', 'bootstrap'],

    function(ol, toolbar, layermanager, geojson) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.datasource_selector',
            'hs.geolocation',
            'hs.cesium',
            'hs.sidebar',
            'hs.ows'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', '$compile', '$timeout', function(OlMap, Core, $compile, $timeout) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    angular.element('.page-content', element).append($compile('<div hs.cesium.directive ng-controller="hs.cesium.controller"></div>')(scope));
                    $timeout(function(){Core.fullScreenMap(element)}, 0);
                }
            };
        }]);
        
        module.directive('hs.aboutproject', function() {
            function link(scope,element,attrs) {
                setTimeout(function(){
                    $('#about-dialog').modal('show');
                }, 1500);
            }           
            return {
                templateUrl: './about.html?bust=' + gitsha,
                link: link
            };
        });

        function getHostname() {
            var url = window.location.href
            var urlArr = url.split("/");
            var domain = urlArr[2];
            return urlArr[0] + "//" + domain;
        };

        module.value('config', {
            terrain_provider: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
            terrain_providers: [{
                title: 'Local terrain',
                url: 'http://gis.lesprojekt.cz/cts/tilesets/rostenice_dmp1g/',
                active: false
            }, {
                title: 'EU-DEM',
                url: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
                active: true
            }],
            default_layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM(),
                    title: "OpenStreetMap",
                    base: true,
                    visible: false,
                    minimumTerrainLevel: 15
                }),
                new ol.layer.Tile({
                    title: "Corine land cover (WMS)",
                    source: new ol.source.TileWMS({
                        url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/olu/european_openlandusemap.map',
                        params: {
                            LAYERS: 'corine',
                            FORMAT: "image/png",
                            INFO_FORMAT: "text/html",
                            minimumTerrainLevel: 9
                        },
                        crossOrigin: null
                    }),
                    minResolution: 2.388657133911758,
                    path: 'Open-Land-Use Map',
                    visible: false,
                    opacity: 0.7
                }),
                new ol.layer.Tile({
                    title: "Open-Land-Use (WMS)",
                    source: new ol.source.TileWMS({
                        url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/olu/openlandusemap.map',
                        params: {
                            LAYERS: 'olu_bbox_srid',
                            FORMAT: "image/png",
                            INFO_FORMAT: "text/html",
                            minimumTerrainLevel: 15
                        },
                        crossOrigin: null
                    }),
                    legends: ['http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/openlandusemap.map&service=WMS&request=GetLegendGraphic&layer=olu_bbox_srid&version=1.3.0&format=image/png&sld_version=1.1.0'],
                    maxResolution: 8550,
                    path: 'Open-Land-Use Map',
                    visible: true,
                    opacity: 0.7
                }),
                new ol.layer.Tile({
                    title: "Yield potential Rostenice",
                    source: new ol.source.TileWMS({
                        url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map',
                        params: {
                            LAYERS: 'yield_potential',
                            FORMAT: "image/png",
                            INFO_FORMAT: "text/html",
                            minimumTerrainLevel: 14
                        },
                        crossOrigin: null
                    }),
                    legends: ['http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/3d_olu/rostenice.map&service=WMS&request=GetLegendGraphic&layer=yield_potential&version=1.3.0&format=image/png&sld_version=1.1.0'],
                    maxResolution: 8550,
                    visible: false,
                    opacity: 0.7
                })
            ],
            project_name: 'erra/map',
            datasources: [
                {
                    title: "Datasets",
                    url: "http://otn-dev.intrasoft-intl.com/otnServices-1.0/platform/ckanservices/datasets",
                    language: 'eng',
                    type: "ckan",
                    download: true
                }, {
                    title: "Services",
                    url: "http://cat.ccss.cz/csw/",
                    language: 'eng',
                    type: "micka",
                    code_list_url: 'http://www.whatstheplan.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
                }, {
                    title: "Hub layers",
                    url: "http://opentnet.eu/php/metadata/csw/",
                    language: 'eng',
                    type: "micka",
                    code_list_url: 'http://opentnet.eu/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
                }
            ],
            hostname: {
                "default": {
                    "title": "Default",
                    "type": "default",
                    "editable": false,
                    "url": getHostname()
                }
            },
            'catalogue_url': "/php/metadata/csw",
            'compositions_catalogue_url': "/php/metadata/csw",
            status_manager_url: '/wwwlibs/statusmanager2/index.php',
            default_view: new ol.View({
                center: [1208534.8815206578, 5761821.705531779],
                zoom: 16,
                units: "m"
            })
        });

        module.controller('Main', ['$scope', '$compile', '$element', 'Core', 'hs.map.service', 'config',
            function($scope, $compile, $element, Core, OlMap, config) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                
                Core.singleDatasources = true;
                Core.panelEnabled('compositions', true);
                Core.panelEnabled('status_creator', false);
                $scope.Core.setDefaultPanel('layermanager');
                 
                function createAboutDialog() {
                    var el = angular.element('<div hs.aboutproject></div>');
                    $("#hs-dialog-area").append(el);
                    $compile(el)($scope);
                }
                createAboutDialog();
                
                $scope.$on('infopanel.updated', function(event) {});
            }
        ]);

        return module;
    });
