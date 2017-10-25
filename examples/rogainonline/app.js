'use strict';

define(['ol', 'toolbar', 'layermanager', 'geojson', 'pois', 'olus', 'sidebar', 'query', 'search', 'print', 'permalink', 'measure', 'geolocation', 'api', 'cesium', 'ows', 'cesiumjs', 'bootstrap'],

    function (ol, toolbar, layermanager, geojson, pois, olus) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.query',
            'hs.search', 'hs.print', 'hs.permalink',
            'hs.geolocation',
            'hs.cesium',
            'hs.sidebar',
            'hs.ows'
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
                pois.createPoiLayer(),
                olus.createOluLayer()
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

                $rootScope.$on('map.loaded', function () {
                    map = hs_map.map;
                });

                pois.init($scope, $compile);
                olus.init($scope, $compile);


                $rootScope.$on('map.sync_center', function (e, center, bounds) {
                    pois.getPois(map, utils, bounds);
                })

                function createAboutDialog() {
                    var el = angular.element('<div hs.aboutproject></div>');
                    $("#hs-dialog-area").append(el);
                    $compile(el)($scope);
                }
                createAboutDialog();

                $scope.showInfo = function (entity) {
                    var id, obj_type;
                    if (entity.properties.olu) { id = entity.properties.olu.getValue(); obj_type = 'Land use parcel' }
                    $scope.zone = {
                        id: $sce.trustAsHtml(),
                        attributes: [],
                        links: [],
                        obj_type: obj_type
                    };
                    describeOlu(id, function () {
                        if (!$scope.$$phase) $scope.$apply();
                    });
                }

                function describeOlu(id, callback) {
                    var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('describe <' + id + '>') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
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
                                $scope.zone.attributes.push({ short_name: short_name, value: b.o.value });
                            }
                            getLinksTo(id, callback);
                        })
                }

                function getLinksTo(id, callback) {
                    var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('PREFIX geo: <http://www.opengis.net/ont/geosparql#> PREFIX geof: <http://www.opengis.net/def/function/geosparql/> PREFIX virtrdf: <http://www.openlinksw.com/schemas/virtrdf#> PREFIX poi: <http://www.openvoc.eu/poi#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> SELECT * WHERE {?obj <http://www.opengis.net/ont/geosparql#hasGeometry> ?obj_geom. ?obj_geom geo:asWKT ?Coordinates . FILTER(bif:st_intersects (?Coordinates, ?wkt)). { SELECT ?wkt WHERE { <' + id + '> geo:hasGeometry ?geometry. ?geometry geo:asWKT ?wkt.} } }') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                    $.ajax({
                        url: utils.proxify(q)
                    })
                        .done(function (response) {
                            for (var i = 0; i < response.results.bindings.length; i++) {
                                var b = response.results.bindings[i];
                                $scope.zone.links.push({ url: b.obj.value });
                            }
                            callback();
                        })
                }

                var character;
                var modelMatrix;
                var viewer;
                var pos_lon_lat = [15.059050160013555, 50.776750405293804];
                var position = Cesium.Cartesian3.fromDegrees(pos_lon_lat[0], pos_lon_lat[1], 412.0);
                var pick_rectangle;
                var pick_rectangle_primitive;

                function createPickRectanglePrimitive() {
                    pick_rectangle = new Cesium.GeometryInstance({
                        geometry: new Cesium.RectangleGeometry({
                            rectangle: Cesium.Rectangle.fromDegrees(pos_lon_lat[0] - 0.0001, pos_lon_lat[1] - 0.0001, pos_lon_lat[0] + 0.0001, pos_lon_lat[1] + 0.0002)
                        }),
                        id: 'rectangle2',
                        attributes: {
                            color: new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 1.0, 0.5)
                        }
                    });
                    pick_rectangle_primitive = viewer.scene.primitives.add(new Cesium.GroundPrimitive({
                        geometryInstances: pick_rectangle,
                        allowPicking: true,
                        releaseGeometryInstances: false
                    }));
                }

                $rootScope.$on('cesium_position_clicked', function (event, lon_lat) {
                    pos_lon_lat[0] = lon_lat[0]; 
                    pos_lon_lat[1] = lon_lat[1];
                    calculateAltitude()
                });

                $rootScope.$on('cesiummap.loaded', function (event, _viewer) {
                    viewer = _viewer;
                    viewer.scene.globe.depthTestAgainstTerrain = true;
                   

                    var scene = viewer.scene;

                    character = viewer.entities.add({
                        model: {
                            uri: 'Cesium_Man.gltf',
                            scale: 2
                        },
                        position: new Cesium.CallbackProperty(function () {
                            return position
                        }, false),
                    });
                    Cesium.when(character.readyPromise).then(function (model) {
                        model.activeAnimations.addAll({
                            loop: Cesium.ModelAnimationLoop.REPEAT,
                            speedup: 2,
                        });
                    });

                    setInterval(calculateAltitude, 5000);
                    setInterval(positionCharacter, 60);
                    viewer.trackedEntity = character;
                });

                function positionCharacter() {
                    pos_lon_lat[0] += 0.000002;
                    position = Cesium.Cartesian3.fromDegrees(pos_lon_lat[0], pos_lon_lat[1], pos_lon_lat[2]);
                }

                function calculateAltitude() {
                    var positions = [
                        Cesium.Cartographic.fromDegrees(pos_lon_lat[0], pos_lon_lat[1])
                    ];
                    var promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positions);
                    Cesium.when(promise, function (updatedPositions) {
                        pos_lon_lat[2] = updatedPositions[0].height;
                        position = Cesium.Cartesian3.fromDegrees(pos_lon_lat[0], pos_lon_lat[1], pos_lon_lat[2]);
                        createPickRectanglePrimitive();
                        olus.getOlus(map, utils, pos_lon_lat);
                    });
                }

                $scope.$on('infopanel.updated', function (event) { });
            }
        ]);

        return module;
    });
