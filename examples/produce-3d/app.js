'use strict';

define(['angular', 'ol', 'moment', 'olus', 'zones', 'pois', 'sidebar', 'toolbar', 'layermanager', 'hs.source.SparqlJson', 'map', 'query', 'search', 'print', 'permalink', 'measure', 'legend', 'geolocation', 'core', 'api', 'angular-gettext', 'bootstrap', 'translations', 'compositions', 'status_creator', 'ows', 'hscesium', 'angular-gettext'],

    function (angular, ol, moment, olus, zones, pois, sidebar, toolbar, layermanager, SparqlJson) {
        var module = angular.module('hs', [
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.permalink', 'hs.measure',
            'hs.geolocation', 'hs.core',
            'hs.api',
            'gettext',
            'hs.sidebar',
            'hs.cesium'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', '$compile', '$timeout', function (OlMap, Core, $compile, $timeout) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function (scope, element) {
                    $timeout(function () {
                        Core.fullScreenMap(element)
                    }, 0);
                }
            };
        }])

            .directive('hs.foodiezones.infoDirective', function () {
                return {
                    templateUrl: './info.html?bust=' + gitsha,
                    link: function (scope, element, attrs) {
                        $('#zone-info-dialog').modal('show');
                    }
                };
            }).directive('description', ['$compile', 'hs.utils.service', function ($compile, utils) {
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
                                url: q
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
            cesiumInfoBox: false,
            default_layers: [new ol.layer.Tile({
                source: new ol.source.OSM({
                    wrapX: false
                }),
                title: "Base layer",
                visible: false,
                base: true
            })],
            //project_name: 'hslayers',
            default_view: new ol.View({
                center: [-8.796119, 41.942791],
                zoom: 16,
                units: "m",
                projection: 'EPSG:4326'
            })
        });

        module.controller('Main', ['$scope', 'Core', 'hs.query.baseService', 'hs.compositions.service_parser', '$timeout', 'hs.map.service', '$http', 'config', '$rootScope', 'hs.utils.service', '$compile', 'hs.query.wmsService', '$sce', 'gettext',
            function ($scope, Core, QueryService, composition_parser, $timeout, hsMap, $http, config, $rootScope, utils, $compile, WmsService, $sce, gettext) {
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.sidebarExpanded = false;
                var map;
                var zones_source = new ol.source.Vector();
                var olus_source = new ol.source.Vector();
                var spoi_source = new ol.source.Vector();

                $rootScope.$on('map.loaded', function () {
                    map = hsMap.map;
                    olus.init($scope, $compile, map, utils);
                    pois.init($scope, $compile);
                    map.on('moveend', extentChanged);
                });

                $rootScope.$on('cesiummap.loaded', function (event, _viewer) {
                    zones.init($scope, $compile, map, utils, _viewer);
                    zones.get();
                })

                function extentChanged() {
                    olus.get();
                }

                $rootScope.$on('map.sync_center', function (e, center, bounds) {
                    pois.getPois(map, utils, bounds);
                })

                config.default_layers.push(olus.createOluLayer(gettext));
                config.default_layers.push(zones.createLayer(gettext));
                config.default_layers.push(pois.createPoiLayer(gettext));

                $scope.showInfo = function (zone) {
                    var id, obj_type, links_to_id;
                    function scopeApply() {
                        if (!$scope.$$phase) $scope.$apply();
                    }
                    function clear() {
                        $scope.zone = {
                            id: $sce.trustAsHtml(),
                            attributes: [],
                            special_attributes: [],
                            links: [],
                            obj_type: obj_type
                        };
                    }
                    if (zone.properties['prod']) {
                        id = zone.properties['prod'].getValue();
                        obj_type = 'Management Zone';
                        links_to_id = zone.properties['management zone'].getValue();
                        clear();
                        describeZone(zone, scopeApply, links_to_id);
                    }
                    if (zone.properties.poi) {
                        id = zone.properties.poi.getValue();
                        obj_type = 'Point of interest';
                        links_to_id = id;
                        clear();
                        describe(id, scopeApply, links_to_id);
                    }
                    if (zone.properties.parcel) {
                        id = zone.properties.parcel.getValue();
                        obj_type = 'Land use parcel';
                        links_to_id = id;
                        clear();
                        describe(id, scopeApply, links_to_id);
                    }
                }

                function describe(id, callback, links_to_id) {
                    if (typeof links_to_id == 'undefined') links_to_id = id;
                    var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('describe <' + id + '>') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                    $.ajax({
                        url: q
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
                            $scope.getLinksTo(links_to_id, callback);
                        })
                }

                function describeZone(zone, callback, links_to_id) {
                    if (typeof links_to_id == 'undefined') links_to_id = id;
                    var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('describe <' + zone.properties['prod'].getValue() + '>') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                    $scope.zone.image = zone.properties.image.getValue();
                    $scope.zone.crop_dbpedia = zone.properties.crop_dbpedia.getValue();
                    $scope.zone.special_attributes.push({ short_name: 'Management zone', value: zone.properties.zone_name.getValue() });
                    $scope.zone.special_attributes.push({ short_name: 'Crop', value: zone.properties['crop description'].getValue() });
                    $scope.zone.special_attributes.push({ short_name: 'Production amount', value: zone.properties.amount.getValue() });
                    $scope.zone.special_attributes.push({ short_name: 'Campaign', value: moment(zone.properties.campaign_begin.getValue()).format('MMMM Do YYYY') + ' - ' + moment(zone.properties.campaign_end.getValue()).format('MMMM Do YYYY') });
                    $.ajax({
                        url: q
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

                            $scope.getLinksTo(links_to_id, callback);
                        })
                }

                $scope.getLinksTo = function (id, callback) {
                    var q = 'https://www.foodie-cloud.org/sparql?default-graph-uri=&query=' + encodeURIComponent('PREFIX geo: <http://www.opengis.net/ont/geosparql#> PREFIX geof: <http://www.opengis.net/def/function/geosparql/> PREFIX virtrdf: <http://www.openlinksw.com/schemas/virtrdf#> PREFIX poi: <http://www.openvoc.eu/poi#> PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> SELECT * WHERE {?obj <http://www.opengis.net/ont/geosparql#hasGeometry> ?obj_geom. ?obj_geom geo:asWKT ?Coordinates . FILTER(bif:st_intersects (?Coordinates, ?wkt)). { SELECT ?wkt WHERE { <' + id + '> geo:hasGeometry ?geometry. ?geometry geo:asWKT ?wkt.} } }') + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
                    $.ajax({
                        url: q
                    })
                        .done(function (response) {
                            for (var i = 0; i < response.results.bindings.length; i++) {
                                var b = response.results.bindings[i];
                                $scope.zone.links.push({ url: b.obj.value });
                            }
                            callback();
                        })
                }

                $scope.$on('infopanel.feature_selected', function (event, feature) {
                    $scope.showInfo(feature);
                })

                $scope.$on('popupOpened', function (e, source) {
                    if (angular.isDefined(source) && source != "inside" && angular.isDefined(popup)) popup.hide();
                })

                $scope.$on('query.dataUpdated', function (event) {
                    if (console) console.log('Attributes', QueryService.data.attributes, 'Groups', QueryService.data.groups);
                });

                Core.setMainPanel('info');
                Core.panelEnabled('compositions', false);
                Core.panelEnabled('status_creator', false);
            }
        ]);

        return module;
    });
