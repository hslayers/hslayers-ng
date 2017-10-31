'use strict';

define(['ol', 'toolbar', 'layermanager', 'geojson', 'pois', 'olus', 'stations', 'sidebar', 'query', 'print', 'permalink', 'measure', 'geolocation', 'api', 'cesium', 'ows', 'cesiumjs', 'bootstrap'],

    function (ol, toolbar, layermanager, geojson, pois, olus, stations) {
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

                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;

                Core.singleDatasources = true;
                Core.panelEnabled('compositions', true);
                Core.panelEnabled('status_creator', false);
                $scope.Core.setDefaultPanel('layermanager');
                $scope.time_remaining = new Date(0, 1, 0, 6, 30, 0, 0);
                $scope.points_collected = 0;

                $rootScope.$on('map.loaded', function () {
                    map = hs_map.map;
                });

                pois.init($scope, $compile);
                olus.init($scope, $compile);
                stations.init($scope, $compile);


                $rootScope.$on('map.sync_center', function (e, center, bounds) {
                    //pois.getPois(map, utils, bounds);
                })

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

                createAboutDialog();
                createHud();

                $scope.createNewMap = function () {
                    $scope.game_started = true;
                    $scope.points_collected = 0;
                    $scope.time_remaining = new Date(0, 1, 0, 6, 30, 0, 0);
                    stations.createStations(map, utils, pos_lon_lat);
                }

                var character;
                var modelMatrix;
                var viewer;
                var pos_lon_lat = [15.05895482842926, 50.77674947558131];
                var pick_rectangle;
                var pick_rectangle_primitive = null;
                var target_position = pos_lon_lat;
                var orientation = [0, 0];
                var orientation_property;
                var last_time = 0;

                function createPickRectanglePrimitive() {
                    if (pick_rectangle_primitive != null) {
                        viewer.scene.primitives.remove(pick_rectangle_primitive);
                    }
                    pick_rectangle = new Cesium.GeometryInstance({
                        geometry: new Cesium.CircleGeometry({
                            center: Cesium.Cartesian3.fromDegrees(target_position[0], target_position[1]),
                            radius: 0.5
                        }),
                        id: 'target1',
                        attributes: {
                            color: new Cesium.ColorGeometryInstanceAttribute(0.0, 0.8, 0.1, 0.5)
                        }
                    });
                    pick_rectangle_primitive = viewer.scene.primitives.add(new Cesium.GroundPrimitive({
                        geometryInstances: pick_rectangle,
                        allowPicking: true,
                        releaseGeometryInstances: false
                    }));
                }

                $rootScope.$on('cesium_position_clicked', function (event, lon_lat) {
                    target_position = lon_lat;
                    acceleration_started_at = last_time;
                    acceleration_start_speed = current_speed;
                    next_speed = olus.getSpeed(pos_lon_lat);
                    console.log('click');
                    createPickRectanglePrimitive();
                    calculateAltitude()
                });

                var position_property;
                $rootScope.$on('cesiummap.loaded', function (event, _viewer) {
                    viewer = _viewer;
                    viewer.scene.globe.depthTestAgainstTerrain = true;

                    var screenSpaceEventHandler = viewer.screenSpaceEventHandler;
                    screenSpaceEventHandler.setInputAction(function () {
                        viewer.scene.screenSpaceCameraController.enableZoom = false;
                    }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

                    screenSpaceEventHandler.setInputAction(function () {
                        viewer.scene.screenSpaceCameraController.enableZoom = true;
                    }, Cesium.ScreenSpaceEventType.RIGHT_UP);


                    var scene = viewer.scene;
                    position_property = new Cesium.CallbackProperty(function () {
                        return Cesium.Cartesian3.fromDegrees(pos_lon_lat[0], pos_lon_lat[1], pos_lon_lat[2])
                    }, false);
                    orientation_property = new Cesium.CallbackProperty(function () {
                        var head_rad = Math.atan2(orientation[1], orientation[0]);
                        var heading = -head_rad;
                        var pitch = 0.0;
                        var roll = 0.0;
                        var hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
                        return Cesium.Transforms.headingPitchRollQuaternion(position_property.getValue(), hpr)
                    }, false);

                    character = viewer.entities.add({
                        model: {
                            uri: 'Cesium_Man.gltf',
                            scale: 2
                        },
                        billboard: {
                            image: 'runner.png',
                            pixelOffset: new Cesium.Cartesian2(0, -36), scaleByDistance: new Cesium.NearFarScalar(100, 0.01, 500, 0.1),
                        },
                        position: position_property,
                        orientation: orientation_property
                    });

                    function tick(timestamp) {
                        if (timestamp) {
                            var time_ellapsed = timestamp - last_time;
                            if ($scope.game_started) {
                                $scope.time_remaining -= time_ellapsed * 24;
                            }

                            positionCharacter(time_ellapsed, timestamp);
                            calculateAltitude();
                            updMap();
                            updHud();
                            last_time = timestamp;
                        }
                        Cesium.requestAnimationFrame(tick);
                    }
                    tick();

                    var positions = [
                        Cesium.Cartographic.fromDegrees(pos_lon_lat[0], pos_lon_lat[1])
                    ];
                    var promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positions);
                    Cesium.when(promise, function (updatedPositions) {
                        pos_lon_lat[2] = updatedPositions[0].height;
                        viewer.camera.flyTo({
                            destination: Cesium.Cartesian3.fromDegrees(pos_lon_lat[0], pos_lon_lat[1] + 0.0005, pos_lon_lat[2] + 60),
                            orientation: {
                                heading: Cesium.Math.toRadians(180.0),
                                pitch: Cesium.Math.toRadians(-45.0),
                                roll: 0.0
                            }
                        })
                    });
                });

                var next_speed = 0.0;
                var current_speed = 0.0;
                var acceleration_started_at = 0.0;
                var acceleration_start_speed = 0.0;
                function positionCharacter(time_ellapsed, timestamp) {
                    var accelerating_for = (timestamp - acceleration_started_at);
                    if (accelerating_for > 3000) accelerating_for = 3000;
                    current_speed = acceleration_start_speed + (next_speed - acceleration_start_speed) * accelerating_for / 3000;
                    var speed = current_speed * time_ellapsed / 1000.0;
                    if (speed > 0) {
                        var diff = { x: target_position[0] - pos_lon_lat[0], y: target_position[1] - pos_lon_lat[1] };
                        if (Math.sqrt(diff.x * diff.x + diff.y * diff.y) < speed) {
                            //target_position = null;
                            next_speed = 0.0;
                            current_speed = 0.0;
                            acceleration_start_speed = 0.0;
                            speed = 0.0;
                            return;
                        }
                        //Hen going straight to north or south, half of speed must be canceled because there are 90 latitude degrees but 180 longitude
                        var degree_canceler = Math.abs(Math.sin(Math.atan2(diff.y, diff.x)));
                        normalize(diff, speed - (0.5 * speed * degree_canceler));
                        var secs_km = (350 / (speed * 100000.0)).toFixed(0);
                        $scope.min_km = Math.floor(secs_km / 60) + ':' + (secs_km % 60 < 10 ? '0' : '') + (secs_km % 60);
                        var new_position = [pos_lon_lat[0] + diff.x, pos_lon_lat[1] + diff.y];
                        next_speed = olus.getSpeed(new_position);
                        if (next_speed > 0) {
                            orientation = [diff.x, diff.y];
                            pos_lon_lat[0] = new_position[0];
                            pos_lon_lat[1] = new_position[1];
                            $scope.points_collected += stations.checkAtCoords(Cesium.Cartesian3.fromDegrees(pos_lon_lat[0], pos_lon_lat[1], 0));
                        } else {
                            current_speed = 0.0;
                            acceleration_start_speed = 0.0;
                        }
                    }
                }

                function normalize(point, scale) {
                    var norm = Math.sqrt(point.x * point.x + point.y * point.y);
                    if (norm != 0) { // as3 return 0,0 for a point of zero length
                        point.x = scale * point.x / norm;
                        point.y = scale * point.y / norm;
                    }
                }

                var last_position_loaded = [0, 0];
                var last_map_calculated = 0;
                function updMap() {
                    if (last_time - last_map_calculated < 500) return;
                    last_map_calculated = last_time;
                    var diff = { x: pos_lon_lat[0] - last_position_loaded[0], y: pos_lon_lat[1] - last_position_loaded[1] };
                    if (last_map_calculated == [0, 0] || Math.sqrt(diff.x * diff.x + diff.y * diff.y) > 0.002 * 0.8) {
                        olus.getOlus(map, utils, pos_lon_lat);
                        last_position_loaded = [pos_lon_lat[0], pos_lon_lat[1]];
                    }
                }

                var last_hud_updated = 0;
                function updHud() {
                    if (last_time - last_hud_updated < 1000) return;
                    last_hud_updated = last_time;
                    if (!$scope.$$phase) $scope.$apply();
                }

                var last_altitude_calculated = 0;
                var last_position_altitude = [0, 0];
                function calculateAltitude() {
                    if (last_time - last_altitude_calculated < 500) return;
                    last_altitude_calculated = last_time;
                    var diff = { x: pos_lon_lat[0] - last_position_altitude[0], y: pos_lon_lat[1] - last_position_altitude[1] };
                    if (Math.sqrt(diff.x * diff.x + diff.y * diff.y) > 0.00001) {
                        last_position_altitude = [pos_lon_lat[0], pos_lon_lat[1]];
                        var positions = [
                            Cesium.Cartographic.fromDegrees(pos_lon_lat[0], pos_lon_lat[1])
                        ];
                        var promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positions);
                        Cesium.when(promise, function (updatedPositions) {
                            pos_lon_lat[2] = updatedPositions[0].height;
                            last_position = position.clone();
                        });
                    }
                }

                $scope.$on('infopanel.updated', function (event) { });
            }
        ]);

        return module;
    });
