/**
 * @namespace hs.trip_planner
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core', 'focusIf'],

    function(angular, ol) {
        angular.module('hs.trip_planner', ['hs.map', 'hs.core', 'focus-if'])
            /**
            * @memberof hs.trip_planner
            * @ngdoc directive
            * @name hs.trip_planner.directive
            * @description Add trip planner panel html template to the map
            */
            .directive('hs.tripPlanner.directive', ['config', function (config) {
                return {
                    template: require('components/trip_planner/partials/trip_planner.html')
                };
            }])

        /**
        * @memberof hs.trip_planner
        * @ngdoc service
        * @name hs.trip_planner.service
        * @description Service managing trip planning functions - loading, adding, storing, removing waypoints and calculating route
        */
        .service("hs.trip_planner.service", ['Core', 'hs.map.service', 'hs.utils.service', '$http', 'hs.permalink.urlService',
            function(Core, OlMap, utils, $http, permalink) {
                var me = {
                    waypoints: [],
                    scopes: [],
                    /**
                    * Refresh scopes phase
                    * @memberof hs.trip_planner.service
                    * @function digestScopes 
                    */
                    digestScopes: function() {
                        angular.forEach(me.scopes, function(scope) {
                            if (!scope.$$phase) scope.$digest();
                        })
                    },
                    /**
                    * Load selected trip data from plan4all server and calculate routes
                    * @memberof hs.trip_planner.service
                    * @function loadWaypoints
                    * @params {String} uuid Identifier of selected trip
                    */
                    loadWaypoints: function(uuid) {
                        $("meta[property=og\\:title]").attr("content", 'test');
                        var trip_url = '<http://www.sdi4apps.eu/trips.rdf#' + uuid + '>';
                        var query = 'SELECT * FROM <http://www.sdi4apps.eu/trips.rdf> WHERE {' + trip_url + ' ?p ?o}';
                        $.ajax({
                                url: '//data.plan4all.eu/sparql?default-graph-uri=&query=' + encodeURIComponent(query) + '&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
                            })
                            .done(function(response) {
                                angular.forEach(response.results.bindings, function(record) {
                                    if (record.p.value == 'http://www.sdi4apps.eu/trips.rdf#waypoints') {
                                        me.waypoints = JSON.parse(record.o.value);
                                    }
                                })
                                me.calculateRoutes();
                            });
                    },
                    /**
                    * Add waypoint to waypoint list and recalculate route
                    * @memberof hs.trip_planner.service
                    * @function addWaypoint
                    * @param {Number} lon Longitude number (part of Ol.coordinate Array)
                    * @param {Number} lat Latitude number (part of Ol.coordinate Array)
                    */
                    addWaypoint: function(lon, lat) {
                        if (permalink.getParamValue('trip') == null) {
                            me.trip = utils.generateUuid();
                            permalink.push('trip', me.trip);
                            permalink.update();
                        }
                        var wp = {
                            lon: lon,
                            lat: lat,
                            name: 'Waypoint ' + (me.waypoints.length + 1),
                            hash: ('Waypoint ' + me.waypoints.length + Math.random()).hashCode().toString(),
                            routes: []
                        }
                        angular.forEach(me.scopes, function(scope) {
                            if (angular.isDefined(scope.waypointAdded)) scope.waypointAdded(wp);
                        })
                        me.waypoints.push(wp);
                        me.storeWaypoints();
                        me.calculateRoutes();
                        me.digestScopes();
                    },
                    /**
                    * Store current waypoints on remote Plan4All server if possible
                    * @memberof hs.trip_planner.service
                    * @function storeWaypoints 
                    */
                    storeWaypoints: function() {
                        if (permalink.getParamValue('trip_editable') == null) return;
                        var waypoints = [];
                        angular.forEach(me.waypoints, function(wp) {
                            waypoints.push({
                                name: wp.name,
                                lon: wp.lon,
                                lat: wp.lat,
                                routes: []
                            });
                        });
                        var trip_url = '<http://www.sdi4apps.eu/trips.rdf#' + me.trip + '>';
                        var waypoints_url = '<http://www.sdi4apps.eu/trips.rdf#waypoints>';
                        var query = 'WITH <http://www.sdi4apps.eu/trips.rdf> DELETE {?t ?p ?s} INSERT {' + trip_url + ' ' + waypoints_url + ' "' + JSON.stringify(waypoints).replace(/"/g, '\\"') + '"} WHERE {?t ?p ?s. FILTER(?t = ' + trip_url + '). }';
                        $.ajax({
                                type: 'POST',
                                data: {
                                    query: query
                                },
                                url: '//data.plan4all.eu/sparql?default-graph-uri=&should-sponge=&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on'
                            })
                            .done(function(response) {
                                console.log(response);
                            });
                    },
                    /**
                    * Remove selected waypoint from trip
                    * @memberof hs.trip_planner.service
                    * @function removeWaypoint
                    * @param {Object} wp Waypoint object to remove
                    */
                    removeWaypoint: function(wp) {
                        var prev_index = me.waypoints.indexOf(wp) - 1;
                        if (prev_index > -1 && me.waypoints[prev_index].routes.length > 0) {
                            angular.forEach(me.waypoints[prev_index].routes, function(route) {
                                angular.forEach(me.scopes, function(scope) {
                                    if (angular.isDefined(scope.routeRemoved)) scope.routeRemoved(route);
                                })
                            });
                            me.waypoints[prev_index].routes = [];
                        }

                        angular.forEach(me.scopes, function(scope) {
                            angular.forEach(wp.routes, function(route) {
                                if (angular.isDefined(scope.routeRemoved)) scope.routeRemoved(route);
                            });
                            scope.waypointRemoved(wp);
                        });
                        me.waypoints.splice(me.waypoints.indexOf(wp), 1);
                        me.storeWaypoints();
                        me.calculateRoutes();
                        me.digestScopes();
                    },
                    /**
                    * Calculate routes between stored waypoints
                    * @memberof hs.trip_planner.service
                    * @function calculateRoutes 
                    */
                    calculateRoutes: function() {
                        for (var i = 0; i < me.waypoints.length - 1; i++) {
                            var wpf = me.waypoints[i];
                            var wpt = me.waypoints[i + 1];
                            if (wpf.routes.length == 0) {
                                wpt.loading = true;
                                $.ajax({
                                        method: 'GET',
                                        url: utils.proxify('http://www.yournavigation.org/api/1.0/gosmore.php?flat=' + wpf.lat + '&flon=' + wpf.lon + '&tlat=' + wpt.lat + '&tlon=' + wpt.lon + '&format=geojson'),
                                        cache: false,
                                        i: i
                                    })
                                    .done(function(response) {
                                        var wpt = me.waypoints[this.i + 1];
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

        /**
        * @memberof hs.trip_planner
        * @ngdoc directive
        * @name hs.tripPlanner.toolbarButtonDirective
        * @description Add trip planner button html template to the map
        */
        .directive('hs.tripPlanner.toolbarButtonDirective', ['config', function (config) {
            return {
                template: require('components/trip_planner/partials/toolbar_button_directive.html')
            };
        }])

        /**
        * @memberof hs.trip_planner
        * @ngdoc controller
        * @name hs.trip_planner.controller
        */
        .controller('hs.trip_planner.controller', ['$scope', 'hs.map.service', 'Core', 'hs.trip_planner.service', 'config',
            function($scope, OlMap, Core, service, config) {
                var map = OlMap.map;
                $scope.loaderImage = config.hsl_path + 'img/ajax-loader.gif';

                var source = new ol.source.Vector({});
                var style = function(feature, resolution) {
                    return [new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(255, 255, 255, 0.6)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: '#337AB7',
                            width: 3
                        }),
                        image: new ol.style.Icon({
                            src: feature.get('highlighted') ? config.hsl_path + 'img/pin_white_red32.png' : config.hsl_path + 'img/pin_white_blue32.png',
                            crossOrigin: 'anonymous',
                            anchor: [0.5, 1]
                        })
                    })]
                };

                var vector = new ol.layer.Vector({
                    source: source,
                    style: style,
                    title: 'Travel route'
                });

                var movable_features = new ol.Collection();

                var modify = new ol.interaction.Modify({
                    features: movable_features
                });

                if(angular.isUndefined(OlMap.map))
                    $scope.$on('map.loaded', function(){
                        OlMap.map.addLayer(vector);
                    });
                else {
                    if(console) console.log('add trip layer');
                    OlMap.map.addLayer(vector);
                }
                
                if(angular.isUndefined(config.default_layers))
                    config.default_layers = [];
                config.default_layers.push(vector);
                
                $scope.service = service;
                service.scopes.push($scope);
                var timer;

                /**
                 * Handler of adding waypoint in connected service
                 * @memberof hs.trip_planner.controller
                 * @function waypointAdded 
                 * @param {object} wp Waypoint ojbect, with lat, lon and routes array
                 */
                $scope.waypointAdded = function(wp) {
                    var f = new ol.Feature({
                        geometry: new ol.geom.Point(ol.proj.transform([wp.lon, wp.lat], 'EPSG:4326', OlMap.map.getView().getProjection().getCode())),
                        wp: wp
                    });
                    wp.feature = f;
                    source.addFeature(f);
                    movable_features.push(f);
                    f.on('change', function(e) {
                        if (this.get('wp').routes.length > 0) {
                            removeRoutesForWaypoint(this.get('wp'));
                        }
                        var new_cords = ol.proj.transform(f.getGeometry().getCoordinates(), OlMap.map.getView().getProjection().getCode(), 'EPSG:4326');
                        this.get('wp').lon = new_cords[0];
                        this.get('wp').lat = new_cords[1];
                        var prev_index = service.waypoints.indexOf(this.get('wp')) - 1;
                        if (prev_index > -1 && service.waypoints[prev_index].routes.length > 0) {
                            removeRoutesForWaypoint(service.waypoints[prev_index]);
                        }
                        if (timer != null) clearTimeout(timer);
                        timer = setTimeout(function() {
                            service.calculateRoutes();
                        }, 500);
                    }, f);
                }

                /**
                 * (PRIVATE) Remove routes from selected waypoint
                 * @memberof hs.trip_planner.controller
                 * @function removeRoutesForWaypoint 
                 * @param {object} wp Waypoint to remove routes
                 */
                function removeRoutesForWaypoint(wp) {
                    angular.forEach(wp.routes, function(r) {
                        $scope.routeRemoved(r);
                    })
                    wp.routes = [];
                }

                /**
                 * Clear all waypoints from service and layer
                 * @memberof hs.trip_planner.controller
                 * @function clearAll 
                 */
                $scope.clearAll = function() {
                    $scope.service.waypoints = [];
                    source.clear();
                    if (!$scope.$$phase) $scope.$digest();
                }

                OlMap.map.addInteraction(modify);

                /**
                 * Handler of adding computed route to layer
                 * @memberof hs.trip_planner.controller
                 * @function routeAdded 
                 * @param {GeoJSON} feature Route to add
                 */
                $scope.routeAdded = function(feature) {
                    source.addFeatures(feature);
                }

                /**
                 * Remove selected route from source
                 * @memberof hs.trip_planner.controller
                 * @function routeRemoved 
                 * @param {object} feature Route feature to remove
                 */
                $scope.routeRemoved = function(feature) {
                    try {
                        source.removeFeature(feature);
                    } catch (ex) {}
                }

                /**
                 * Remove selected waypoint from source
                 * @memberof hs.trip_planner.controller
                 * @function waypointRemoved
                 * @param {object} wp Waypoint feature to remove
                 */
                $scope.waypointRemoved = function(wp) {
                    try {
                        source.removeFeature(wp.feature);
                    } catch (ex) {}
                }
                
                
                /**
                 * Format waypoint route distance in a human friendly way
                 * @memberof hs.trip_planner.controller
                 * @function formatDistance
                 * @param {float} wp Wayoint
                 */
                $scope.formatDistance = function(wp){
                    if(wp.routes.length < 1) return '';
                    var distance = wp.routes[0].get('distance');
                    if (typeof distance == 'undefined')
                        return '';
                    else
                        return parseFloat(distance).toFixed(2) + 'km';
                }
                
                 /**
                 * Get the total distance for all waypoint routes
                 * @memberof hs.trip_planner.controller
                 * @function totalDistance
                 */
                $scope.totalDistance  = function(){
                    var tmp = 0;
                    angular.forEach($scope.service.waypoints, function(wp){
                     if(wp.routes.length>0){
                      tmp+=parseFloat(wp.routes[0].get('distance'));   
                     }
                    }
                    )
                    return tmp.toFixed(2) + 'km';
                }

                /**
                 * Remove selected waypoint from source
                 * @memberof hs.trip_planner.controller
                 * @function toggleEdit
                 * @param {object} waypoint 
                 * @param {unknown} e 
                 */
                $scope.toggleEdit = function(waypoint, e) {
                    waypoint.name_editing = !waypoint.name_editing;
                    $scope.service.storeWaypoints();
                    waypoint.feature.set('highlighted', waypoint.name_editing);
                }
                
                $scope.prevPanel = function(){
                    Core.setMainPanel('info');
                }

                $scope.$on('core.mainpanel_changed', function(event) {

                });

                $scope.$emit('scope_loaded', "Trip planner");
            }
        ]);
    })
