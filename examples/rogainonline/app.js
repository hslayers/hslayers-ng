'use strict';

define(['ol', 'toolbar', 'layermanager', 'geojson', 'pois', 'olus', 'stations', 'character', 'sidebar', 'query', 'print', 'permalink', 'measure', 'geolocation', 'api', 'cesium', 'ows', 'cesiumjs', 'bootstrap'],

    function (ol, toolbar, layermanager, geojson, pois, olus, stations, character) {
        var module = angular.module('hs', [
            'hs.layermanager',
            'hs.query',
            'hs.print', 'hs.permalink',
            'hs.geolocation',
            'hs.cesium',
            'hs.sidebar'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', '$compile', '$timeout', function (OlMap, Core, $compile, $timeout) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function (scope, element) {
                    angular.element('.page-content', element).append($compile('<div hs.cesium.directive ng-controller="hs.cesium.controller"></div>')(scope));
                    $timeout(function () { Core.fullScreenMap(element) }, 0);
                }
            };
        }]);

        module.directive('hs.aboutproject', function () {
            function link(scope, element, attrs) {
                setTimeout(function () {
                    $('#about-dialog').modal('show');
                }, 1500);
            }
            return {
                templateUrl: './about.html?bust=' + gitsha,
                link: link
            };
        });

        module.directive('hs.hud', function () {
            return {
                templateUrl: './hud.html?bust=' + gitsha,
                link: function (scope, element, attrs) {

                }
            };
        })


        module.directive('hs.foodiezones.infoDirective', function () {
            return {
                templateUrl: './info.html?bust=' + gitsha,
                link: function (scope, element, attrs) {
                    $('#zone-info-dialog').modal('show');
                }
            };
        })

        module.directive('description', ['$compile', 'hs.utils.service', function ($compile, utils) {
            return {
                templateUrl: './description.html?bust=' + gitsha,
                scope: {
                    object: '=',
                    url: '@'
                },
                link: function (scope, element, attrs) {
                    scope.describe = function (e, attribute) {
                        if (angular.element(e.target).parent().find('table').length > 0) {
                            angular.element(e.target).parent().find('table').remove();
                        } else {
                            var table = angular.element('<table class="table table-striped" description object="attribute' + Math.abs(attribute.value.hashCode()) + '" url="' + attribute.value + '"></table>');
                            angular.element(e.target).parent().append(table);
                            $compile(table)(scope.$parent);
                        }
                    }
                    if (angular.isUndefined(scope.object) && angular.isDefined(attrs.url) && typeof attrs.url == 'string') {
                        scope.object = { attributes: [] };
                        var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('describe <' + attrs.url + '>') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                        $.ajax({
                            url: utils.proxify(q)
                        })
                            .done(function (response) {
                                if (angular.isUndefined(response.results)) return;
                                for (var i = 0; i < response.results.bindings.length; i++) {
                                    var b = response.results.bindings[i];
                                    var short_name = b.p.value;
                                    if (short_name.indexOf('#') > -1)
                                        short_name = short_name.split('#')[1];
                                    scope.object.attributes.push({ short_name: short_name, value: b.o.value });
                                    if (!scope.$$phase) scope.$apply();
                                }
                            })
                    }
                }
            };
        }]);

        module.value('config', {
            terrain_provider: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
            terrain_providers: [{
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
                //pois.createPoiLayer(),
                olus.createOluLayer(),
                stations.createLayer()
            ],
            default_view: new ol.View({
                center: ol.proj.transform([1208534.8815206578, 5761821.705531779], 'EPSG:3857', 'EPSG:4326'),
                zoom: 16,
                units: "m",
                projection: 'EPSG:4326'
            })
        });

        module.controller('Main', ['$scope', '$compile', '$element', 'Core', 'hs.map.service', 'config', '$rootScope', 'hs.utils.service', '$sce',
            function ($scope, $compile, $element, Core, hs_map, config, $rootScope, utils, $sce) {
                var map;
                var viewer;
                var last_time = 0;
                var last_hud_updated = 0;

                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.singleDatasources = true;
                Core.panelEnabled('compositions', true);
                Core.panelEnabled('status_creator', false);
                $scope.Core.setDefaultPanel('layermanager');
                $scope.time_remaining = new Date(0, 1, 0, 6, 30, 0, 0);
                $scope.points_collected = 0;
                pois.init($scope, $compile);
                stations.init($scope, $compile);

                function createAboutDialog() {
                    var el = angular.element('<div hs.aboutproject></div>');
                    $("#hs-dialog-area").append(el);
                    $compile(el)($scope);
                }

                function createHud() {
                    var el = angular.element('<div hs.hud></div>');
                    $(".page-content").append(el);
                    $compile(el)($scope);
                }

                function disableRightMouse(scene) {
                    var screenSpaceEventHandler = viewer.screenSpaceEventHandler;
                    screenSpaceEventHandler.setInputAction(function () {
                        scene.screenSpaceCameraController.enableZoom = false;
                    }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

                    screenSpaceEventHandler.setInputAction(function () {
                        scene.screenSpaceCameraController.enableZoom = true;
                    }, Cesium.ScreenSpaceEventType.RIGHT_UP);
                }

                function tick(timestamp) {
                    if (timestamp) {
                        var time_ellapsed = timestamp - last_time;
                        if ($scope.game_started) {
                            $scope.time_remaining -= time_ellapsed * 24;
                        }

                        character.positionCharacter(time_ellapsed, timestamp);
                        updHud();
                        last_time = timestamp;
                    }
                    Cesium.requestAnimationFrame(tick);
                }

                function updHud() {
                    if (last_time - last_hud_updated < 1000) return;
                    last_hud_updated = last_time;
                    if (!$scope.$$phase) $scope.$apply();
                }

                createAboutDialog();
                createHud();

                $scope.createNewMap = function () {
                    $scope.game_started = true;
                    $scope.points_collected = 0;
                    $scope.time_remaining = new Date(0, 1, 0, 6, 30, 0, 0);
                    var pos_lon_lat = character.currentPos();
                    stations.createStations(map, utils, pos_lon_lat);
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(pos_lon_lat[0] + 0.0001 * 14, pos_lon_lat[1] + 0.0006 * 18, pos_lon_lat[2] + 60 * 18),
                        orientation: {
                            heading: Cesium.Math.toRadians(180.0),
                            pitch: Cesium.Math.toRadians(-45.0),
                            roll: 0.0
                        }
                    })
                }

                $rootScope.$on('cesium_position_clicked', function (event, lon_lat) {
                    console.log('click');
                    character.changeTargetPosition(lon_lat, last_time);
                });

                $rootScope.$on('map.loaded', function () {
                    map = hs_map.map;
                    olus.init($scope, $compile, map, utils);
                });

                $rootScope.$on('cesiummap.loaded', function (event, _viewer) {
                    viewer = _viewer;
                    var scene = viewer.scene;
                    scene.globe.depthTestAgainstTerrain = true;
                    disableRightMouse(scene);
                    character.init($scope, $compile, olus, viewer, stations);
                    tick();
                });

                $rootScope.$on('map.sync_center', function (e, center, bounds) {
                    //pois.getPois(map, utils, bounds);
                })

                $scope.$on('infopanel.updated', function (event) { });
            }
        ]);

        return module;
    });
