'use strict';

define(['ol', 'toolbar', 'layermanager', 'geojson', 'pois', 'olus', 'stations', 'character', 'track', 'gamestates', 'hacks', 'planning', 'sidebar', 'query', 'print', 'permalink', 'measure', 'geolocation', 'api', 'cesium', 'ows', 'cesiumjs', 'bootstrap', 'panel'],

    function (ol, toolbar, layermanager, geojson, pois, olus, stations, character, track, gamestates, hacks, planning) {
        var module = angular.module('hs', [
            'hs.layermanager',
            'hs.query',
            'hs.print', 'hs.permalink',
            'hs.geolocation',
            'hs.cesium',
            'hs.sidebar',
            'hs.rogainonline'
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

        module.directive('hs.enddialog', function () {
            function link(scope, element, attrs) {
                setTimeout(function () {
                    $('#end-dialog').modal('show');
                }, 1500);
            }
            return {
                templateUrl: './end.html?bust=' + gitsha,
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

        module.value('config', {
            terrain_provider: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
            terrain_providers: [{
                title: 'EU-DEM',
                url: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
                active: true
            }],
            cesiumInfoBox: false,
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

        module.controller('Main', ['$scope', '$compile', '$element', 'Core', 'hs.map.service', 'config', '$rootScope', 'hs.utils.service', '$sce', '$timeout', 'hs.geolocation.service', 'Socialshare', 'hs.permalink.service_url', '$http',
            function ($scope, $compile, $element, Core, hs_map, config, $rootScope, utils, $sce, $timeout, geolocation, socialshare, permalink_service, $http) {
                var map;
                var viewer;
                var last_time = 0;
                var last_hud_updated = 0;

                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.singleDatasources = true;
                Core.panelEnabled('compositions', false);
                Core.panelEnabled('status_creator', false);
                Core.panelEnabled('print', false);
                Core.panelEnabled('layermanager', false);
                Core.sidebarExpanded = false;
                Core.classicSidebar = false;
                $scope.time_remaining = new Date(2000, 1, 0, 4, 30, 0, 0);
                $scope.points_collected = 0;
                pois.init($scope, $compile);
                stations.init($scope, $compile, olus);
                $scope.game_mode = Core.isMobile() ? 'real' : 'virtual';
                $scope.time_penalty = 0;
                $scope.ajax_loader = hsl_path + 'img/ajax-loader.gif';
                $scope.time_multiplier = Core.isMobile() ? 1 : 10;
                Core.setDefaultPanel('rogainonline');
                Core.sidebarExpanded = false;

                function createHud() {
                    var el = angular.element('<div hs.hud></div>');
                    $(".page-content").append(el);
                    $compile(el)($scope);
                }

                $scope.$on("scope_loaded", function (event, args) {
                    if (args == 'Sidebar') {
                        var el = angular.element('<div id="test3" hs.rogainonline.panel_directive></div>');
                        angular.element('#panelplace').append(el);
                        $compile(el)($scope);
                    }
                })

                function tick(timestamp) {
                    if (timestamp) {
                        var time_ellapsed = timestamp - last_time;
                        gamestates.tick(timestamp);
                        character.positionCharacter(time_ellapsed, timestamp);
                        last_time = timestamp;
                        updHud();
                    }
                    Cesium.requestAnimationFrame(tick);
                }

                function updHud() {
                    if (last_time - last_hud_updated < 500) return;
                    last_hud_updated = last_time;
                    var target_frame_rate = undefined;
                    if (screen_locked) target_frame_rate = 2;
                    if (viewer.targetFrameRate != target_frame_rate) viewer.targetFrameRate = target_frame_rate;
                    hacks.checkBadPerformance(last_time);
                    if (!$scope.$$phase) $scope.$apply();
                }

                createHud();

                $rootScope.$on('cesium_position_clicked', function (event, lon_lat) {
                    if ($scope.game_state == 'running') character.changeTargetPosition(lon_lat, last_time);
                    if ($scope.game_state == 'planning') planning.addMeasurementPosition(lon_lat);
                });

                $rootScope.$on('map.loaded', function () {
                    map = hs_map.map;
                    if (Core.isMobile()) {
                        if (angular.isUndefined(geolocation.geolocation))
                            geolocation.gpsStatus = true;
                        else
                            geolocation.startGpsWatch();
                    }
                });

                $rootScope.$on('cesiummap.loaded', function (event, _viewer) {
                    viewer = _viewer;
                    var scene = viewer.scene;
                    character.currentPos([hs_map.map.getView().getCenter()[0], hs_map.map.getView().getCenter()[1], 0]);
                    character.init($scope, $compile, olus, viewer, stations);
                    olus.init($scope, $compile, map, utils, _viewer, character);
                    track.init($scope, $compile, viewer, stations, character, gamestates);
                    planning.init($scope, $compile, viewer, stations, character);
                    gamestates.init($scope, $compile, viewer, stations, character, track, utils, map, planning, $timeout);
                    hacks.init($scope, $compile, viewer, character)
                    tick();
                });

                $rootScope.$on('map.sync_center', function (e, center, bounds) {
                    if ($scope.game_state == 'before_game' && angular.isUndefined($scope.geolocated))
                        character.currentPos(center);
                    olus.getOlus(character.currentPos());
                })

                $scope.$on('infopanel.updated', function (event) { });

                $scope.$on('geolocation.updated', function (event, data) {
                    track.locationUpdated(data)
                });

                $scope.locateMe = function () {
                    if (geolocation.last_location && angular.isDefined(geolocation.last_location.latlng)) {
                        $scope.geolocated = true;
                        var l = geolocation.last_location.latlng;
                        character.currentPos([l[0], l[1]]);
                    }
                }

                $scope.share = function () {
                    var tmp_resol = viewer.resolutionScale;
                    viewer.resolutionScale = 1;
                    setTimeout(function () {
                        viewer.render();
                        $.ajax({
                            type: "POST",
                            url: "sharestore.php",
                            data: {
                                img: viewer.canvas.toDataURL()
                            }
                        }).done(function (o) {
                            if (o.result == 1) {
                                shareSocial('facebook', o.file)
                            }
                        });
                        viewer.resolutionScale = tmp_resol;
                    }, 3000)
                }

                function shareSocial(provider, image_file) {
                    var url = permalink_service.getPermalinkUrl() + '&image=' + image_file + '&km=' + encodeURIComponent(($scope.total_distance_run / 1000).toFixed(2));
                    $http.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDn5HGT6LDjLX-K4jbcKw8Y29TRgbslfBw', {
                        longUrl: url
                    }).success(function (data, status, headers, config) {
                        $scope.share_url = data.id;
                        socialshare.share({
                            'provider': provider,
                            'attrs': {
                                'socialshareText': ($scope.total_distance_run / 1000).toFixed(2) + 'km run',
                                'socialshareSubject': ($scope.total_distance_run / 1000).toFixed(2) + 'km run',
                                'socialshareBody': ($scope.total_distance_run / 1000).toFixed(2) + 'km run',
                                'socialshareUrl': $scope.share_url,
                                'socialsharePopupHeight': 600,
                                'socialsharePopupWidth': 500
                            }
                        })
                    }).error(function (data, status, headers, config) {
                        if (console) console.log('Error creating short Url');
                    });
                }
            }
        ]);

        return module;
    });
