/**
 * @namespace hs.trip_planner
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core', 'ngfocusif'],

    function(angular, ol) {
        angular.module('hs.trip_planner', ['hs.map', 'hs.core', 'focus-if'])
            .directive('hs.tripPlanner.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/trip_planner/partials/trip_planner.html?bust=' + gitsha
                };
            })

        .service("hs.trip_planner.service", ['Core', 'hs.map.service', 'hs.utils.service', '$http', 'hs.permalink.service_url',
            function(Core, OlMap, utils, $http, permalink) {
                var me = {
                    waypoints: [],
                    scopes: [],
                    routes: {},
                    digestScopes: function() {
                        angular.forEach(me.scopes, function(scope) {
                            if (!scope.$$phase) scope.$digest();
                        })
                    },
                    loadWaypoints: function(uuid) {
                        $("meta[property=og\\:title]").attr("content", 'test');
                        var trip_url = '<http://www.sdi4apps.eu/trips.rdf#' + uuid + '>';
                        var query = 'SELECT * FROM <http://www.sdi4apps.eu/trips.rdf> WHERE {' + trip_url + ' ?p ?o}';
                        $.ajax({
                                url: '//data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent(query) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
                            })
                            .done(function(response) {
                                angular.forEach(response.results.bindings, function(record){
                                    if(record.p.value=='http://www.sdi4apps.eu/trips.rdf#waypoints'){
                                        me.waypoints = JSON.parse(record.o.value);
                                    }
                                })
                                me.calculateRoutes();
                            });
                    },
                    addWaypoint: function(lon, lat) {
                        if (permalink.getParamValue('trip') == null) {
                            me.trip = utils.generateUuid();
                            permalink.push('trip', me.trip);
                            permalink.update();
                        }
                        me.waypoints.push({
                            lon: lon,
                            lat: lat,
                            name: 'Waypoint ' + (me.waypoints.length + 1),
                            hash: ('Waypoint ' + me.waypoints.length + Math.random()).hashCode().toString(),
                            routes: []
                        });
                        me.storeWaypoints();
                        me.calculateRoutes();
                        me.digestScopes();
                    },
                    storeWaypoints: function() {
                        var waypoints = [];
                        angular.forEach(me.waypoints, function(wp){
                            waypoints.push({name:wp.name, lon:wp.lon, lat:wp.lat, routes:[]});
                        });
                        var trip_url = '<http://www.sdi4apps.eu/trips.rdf#' + me.trip + '>';
                        var waypoints_url = '<http://www.sdi4apps.eu/trips.rdf#waypoints>';
                        var query = 'WITH <http://www.sdi4apps.eu/trips.rdf> DELETE {?t ?p ?s} INSERT {' + trip_url + ' ' + waypoints_url + ' "' + JSON.stringify(waypoints).replace(/"/g, '\\"') + '"} WHERE {?t ?p ?s. FILTER(?t = ' + trip_url + '). }';
                        $.ajax({
                                type: 'POST',
                                data: {query: query},
                                url: '//data.plan4all.eu/sparql?default-graph-uri=&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
                            })
                            .done(function(response) {
                                console.log(response);
                            });
                    },
                    removeWaypoint: function(wp) {
                        angular.forEach(me.scopes, function(scope) {
                            angular.forEach(wp.routes, function(route) {
                                if (angular.isDefined(scope.routeRemoved)) scope.routeRemoved(route);
                            })
                        })
                        me.waypoints.splice(me.waypoints.indexOf(wp), 1);
                        me.storeWaypoints();
                        me.calculateRoutes();
                        me.digestScopes();
                    },
                    calculateRoutes: function() {
                        for (var i = 0; i < me.waypoints.length - 1; i++) {
                            var wpf = me.waypoints[i];
                            var wpt = me.waypoints[i + 1];
                            var hash_pair = wpf.hash + wpt.hash;
                            if (angular.isUndefined(me.routes[hash_pair])) {
                                wpt.loading = true;
                                 $.ajax({
                                    method: 'GET',
                                        url: utils.proxify('http://www.yournavigation.org/api/1.0/gosmore.php?flat=' + wpf.lat + '&flon=' + wpf.lon + '&tlat=' + wpt.lat + '&tlon=' + wpt.lon + '&format=geojson'),
                                        cache: false,
                                        hash_pair: hash_pair,
                                        i: i
                                })
                                .done(function(response) {
                                        var wpt = me.waypoints[this.i+1];
                                        var wpf = me.waypoints[this.i];
                                        wpt.loading = false;
                                        var format = new ol.format.GeoJSON();
                                        var feature = format.readFeatures({
                                            "type": "Feature",
                                            "geometry": response,
                                            "properties": response.properties
                                        }, {
                                            dataProjection: response.crs.name,
                                            featureProjection: OlMap.map.getView().getProjection().getCode()
                                        });
                                        me.routes[this.hash_pair] = feature;
                                        wpt.routes.push(feature[0]);
                                        wpf.routes.push(feature[0]);
                                        angular.forEach(me.scopes, function(scope) {
                                            if (angular.isDefined(scope.routeAdded)) scope.routeAdded(feature);
                                        })
                                        me.digestScopes();
                                });   
                            }
                        }
                    }
                };

                if (permalink.getParamValue('trip') != null) {
                    me.trip = permalink.getParamValue('trip');
                    me.loadWaypoints(me.trip);
                    permalink.push('trip', me.trip);
                }

                return me;
            }
        ])

        .directive('hs.tripPlanner.toolbarButtonDirective', function() {
            return {
                templateUrl: hsl_path + 'components/trip_planner/partials/toolbar_button_directive.html?bust=' + gitsha
            };
        })

        .controller('hs.trip_planner.controller', ['$scope', 'hs.map.service', 'Core', 'hs.trip_planner.service',
            function($scope, OlMap, Core, service) {
                var map = OlMap.map;
                $scope.ajax_loader = hsl_path + 'img/ajax-loader.gif';
                
                var source = new ol.source.Vector({});
                var style = new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#337AB7',
                        width: 3
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                });

                var vector = new ol.layer.Vector({
                    source: source,
                    style: style
                });

                OlMap.map.addLayer(vector);

                $scope.service = service;
                service.scopes.push($scope);

                $scope.clearAll = function() {
                    $scope.service.waypoints = [];
                    source.clear();
                    if (!$scope.$$phase) $scope.$digest();
                }

                $scope.routeAdded = function(feature) {
                    source.addFeatures(feature);
                }

                $scope.routeRemoved = function(feature) {
                    try {
                        source.removeFeature(feature);
                    } catch (ex) {}
                }
                
                $scope.toggleEdit = function(waypoint, e){
                    waypoint.name_editing = !waypoint.name_editing;
                    $scope.service.storeWaypoints();
                }

                $scope.$on('core.mainpanel_changed', function(event) {

                });

                $scope.$emit('scope_loaded', "Trip planner");
            }
        ]);
    })
