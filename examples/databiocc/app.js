'use strict';

define(['ol', 'toolbar', 'moment-interval', 'moment', 'layermanager', 'geojson', 'sidebar', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'api', 'cesium', 'ows', 'datasource_selector', 'cesiumjs', 'bootstrap'],

    function (ol, toolbar, momentinterval, moment, layermanager, geojson) {
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

        module.directive('hs', ['hs.map.service', 'Core', '$compile', '$timeout', function (OlMap, Core, $compile, $timeout) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function (scope, element) {
                    $timeout(function () { Core.fullScreenMap(element) }, 0);
                }
            };
        }]);

        module.directive('hs.hud', function () {
            return {
                templateUrl: './hud.html?bust=' + gitsha,
                link: function (scope, element, attrs) {

                }
            };
        });

        function getHostname() {
            var url = window.location.href
            var urlArr = url.split("/");
            var domain = urlArr[2];
            return urlArr[0] + "//" + domain;
        };

        function prepareTimeSteps(step_string) {
            var step_array = step_string.split(',');
            var steps = [];
            for (var i = 0; i < step_array.length; i++) {
                if (step_array[i].indexOf('/') == -1) {
                    steps.push(new Date(step_array[i]));
                    //console.log(new Date(step_array[i]).toISOString());
                } else {
                    //"2016-03-16T12:00:00.000Z/2016-07-16T12:00:00.000Z/P30DT12H"
                    var interval_def = step_array[i].split('/');
                    var step = moment.interval(interval_def[2]);
                    var interval = moment.interval(interval_def[0] + '/' + interval_def[1]);
                    while (interval.start() < interval.end()) {
                        //console.log(interval.start().toDate().toISOString());
                        steps.push(interval.start().toDate());
                        interval.start(moment.utc(interval.start().toDate()).add(step.period()));
                    }
                }
            }
            return steps;
        }

        var layers = [
            new ol.layer.Tile({
                source: new ol.source.OSM(),
                title: "OpenStreetMap",
                base: true,
                visible: false,
                minimumTerrainLevel: 15
            }),/*
            new ol.layer.Image({
                title: "Road segments of Open Transport Map vizualized by their average daily traffic volumes",
                source: new ol.source.ImageWMS({
                    url: 'https://intenzitadopravy.plzen.eu/wms-t',
                    params: {
                        LAYERS: 'may',
                        VERSION: '1.3.0',
                        FORMAT: "image/png",
                        INFO_FORMAT: "text/html",
                        time: '2018-03-28T09:00:00.000Z',
                        minimumTerrainLevel: 12
                    },
                    crossOrigin: null
                }),
                legends: ['http://gis.lesprojekt.cz/wms/transport/open_transport_map?service=WMS&request=GetLegendGraphic&layer=roads__traffic_volumes&version=1.3.0&format=image/png&sld_version=1.1.0'],
                maxResolution: 8550,
                visible: false,
                opacity: 0.7
            }),*/
        ];

        layers.push(new ol.layer.Image({
            title: 'Latest temperature',
            source: new ol.source.ImageWMS({
                url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/copernicus_marine.map',
                params: {
                    LAYERS: 'temperature',
                    VERSION: '1.3.0',
                    FORMAT: "image/png",
                    INFO_FORMAT: "text/html"
                },
                crossOrigin: null
            }),
            legends: [`http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/copernicus_marine.map?REQUEST=GetLegendGraphic&LAYER=temperature`],
            visible: true,
            opacity: 0.7,
        }));
        


        angular.forEach([
            {
                title: "Density ocean mixed layer thickness",
                layer: 'mlotst',
                style: 'boxfill/ferret',
                palette: 'ferret'
            },
            {
                title: "Sea surface height",
                layer: 'zos',
                style: 'boxfill/ncview',
                palette: 'ncview'
            },
            {
                title: "Sea floor potential temperature",
                layer: 'bottomT',
                style: 'boxfill/occam',
                palette: 'occam'
            },
            {
                title: "Sea ice thickness",
                layer: 'sithick',
                style: 'boxfill/rainbow',
                palette: 'rainbow'
            },
            {
                title: "Ice concentration",
                layer: 'siconc',
                style: 'boxfill/rainbow',
                palette: 'rainbow'
            },
            {
                title: "Temperature",
                layer: 'thetao',
                style: 'boxfill/rainbow',
                palette: 'rainbow'
            },
            {
                title: "Salinity",
                layer: 'so',
                style: 'boxfill/rainbow',
                palette: 'rainbow'
            },
            {
                title: "Automatically-generated sea ice velocity vector field",
                layer: 'sea_ice_velocity',
                style: 'boxfill/rainbow',
                palette: 'rainbow'
            }
        ], function (def) {
            layers.push(new ol.layer.Image({
                title: def.title,
                source: new ol.source.ImageWMS({
                    url: 'http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024?',
                    params: {
                        LAYERS: def.layer,
                        VERSION: '1.3.0',
                        FORMAT: "image/png",
                        INFO_FORMAT: "text/html",
                        time: '2018-02-15T00:00:00.000Z',
                        STYLE: def.style,
                        possible_times: prepareTimeSteps('2016-01-01T12:00:00.000Z/2018-04-28T12:00:00.000Z/P1D')
                    },
                    crossOrigin: null
                }),
                legends: [`http://nrt.cmems-du.eu/thredds/wms/global-analysis-forecast-phy-001-024??REQUEST=GetLegendGraphic&LAYER=${def.layer}&PALETTE=${def.palette}`],
                visible: def.visible || false,
                opacity: 0.7,
                path: 'Physical indicators'
            }));
        });


        angular.forEach([
            {
                title: "Mole Concentration of Dissolved iron in Sea Water",
                layer: 'Fe',
                style: 'boxfill/rainbow',
                palette: 'rainbow'
            },
            {
                title: "Mole Concentration of Nitrate in Sea Water",
                layer: 'NO3',
                style: 'boxfill/rainbow',
                palette: 'rainbow'
            },
            {
                title: "Mole Concentration of Dissolved Oxygen in Sea Water",
                layer: 'O2',
                style: 'boxfill/rainbow',
                palette: 'rainbow'
            },
            {
                title: "Mole Concentration of Phosphate in Sea Water",
                layer: 'PO4',
                style: 'boxfill/rainbow',
                palette: 'rainbow'
            },
            {
                title: "Mole Concentration of Silicate in Sea Water",
                layer: 'Si',
                style: 'boxfill/rainbow',
                palette: 'rainbow'
            },
            {
                title: "Net Primary Productivity of Carbon Per Unit Volume",
                layer: 'PP',
                style: 'boxfill/rainbow',
                palette: 'rainbow'
            },
            {
                title: "Mass Concentration of Chlorophyll in Sea Water",
                layer: 'CHL',
                style: 'boxfill/rainbow',
                palette: 'rainbow'
            },
            {
                title: "Mole Concentration of Phytoplankton expressed as carbon in sea water",
                layer: 'PHYC',
                style: 'boxfill/rainbow',
                palette: 'rainbow'
            }
            
        ], function (def) {
            layers.push(new ol.layer.Image({
                title: def.title,
                source: new ol.source.ImageWMS({
                    url: 'http://nrt.cmems-du.eu/thredds/wms/dataset-global-analysis-forecast-bio-001-014',
                    params: {
                        LAYERS: def.layer,
                        VERSION: '1.3.0',
                        FORMAT: "image/png",
                        INFO_FORMAT: "text/html",
                        time: '2018-04-07T12:00:00.000Z',
                        STYLE: def.style,
                        possible_times: prepareTimeSteps('2011-12-31T12:00:00.000Z/2013-12-14T12:00:00.000Z/P7D,2013-12-22T16:00:00.000Z,2013-12-28T12:00:00.000Z/2018-04-14T12:00:00.000Z/P7D')
                    },
                    crossOrigin: null
                }),
                legends: [`http://nrt.cmems-du.eu/thredds/wms/dataset-global-analysis-forecast-bio-001-014?REQUEST=GetLegendGraphic&LAYER=${def.layer}&PALETTE=${def.palette}`],
                visible: def.visible || false,
                opacity: 0.7,
                path: 'Bio indicators'
            }));
        });

        module.value('config', {
            cesiumTimeline: true,
            cesiumAnimation: true,
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
            default_layers: layers,
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
                center: ol.proj.transform([1208534.8815206578, 5761821.705531779], 'EPSG:3857', 'EPSG:4326'),
                zoom: 5,
                units: "m",
                projection: 'EPSG:4326'
            })
        });

        module.controller('Main', ['$scope', '$compile', '$element', 'Core', 'hs.map.service', 'config', '$rootScope', 'hs.utils.service', '$sce',
            function ($scope, $compile, $element, Core, hs_map, config, $rootScope, utils, $sce) {
                var map;

                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                Core.singleDatasources = true;
                Core.panelEnabled('compositions', true);
                Core.panelEnabled('status_creator', false);
                $scope.Core.setDefaultPanel('layermanager');

                function createHud() {
                    var el = angular.element('<div hs.hud></div>');
                    $(".page-content").append(el);
                    $compile(el)($scope);
                }

                $rootScope.$on('map.loaded', function () {
                    map = hs_map.map;
                });

                $rootScope.$on('map.sync_center', function (e, center, bounds) {

                })

                $rootScope.$on('cesiummap.loaded', function (e, viewer) {
                    viewer.targetFrameRate = 30;
                    viewer.timeline.zoomTo(Cesium.JulianDate.fromDate(new Date('2016-01-01')), Cesium.JulianDate.fromDate(new Date('2018-04-01')));
                    setTimeout(createHud, 3000);
                });



                $rootScope.$on('cesium.time_layers_changed', function (e, time_layers) {
                    $scope.time_layers = time_layers;
                    if (!$scope.$$phase) $scope.$apply();
                    angular.element('.hud').show();
                    if ($scope.timeFader) {
                        clearTimeout($scope.timeFader);
                    }
                    $scope.timeFader = setTimeout(function () {
                        angular.element('.hud').fadeOut();
                    }, 5000)
                })

                $scope.$on('infopanel.updated', function (event) { });
            }
        ]);

        return module;
    });
