/**
 * @namespace hs.routing
 * @memberOf hs
 */
define(['angular','ol','s4a','map','core'], 
    
    function(angular, ol, s4a) {
        angular.module('hs.routing', ['hs.map', 'hs.core'])
        
        /**
         * @memberof hs.routing
         * @ngdoc directive
         * @name hs.routing.directive
         * @description Add routing panel html template to the map
         */
        .directive('hs.routing.directive', ['config', function (config) {
            return {
                template: require('components/routing/partials/routing.html')
            };
        }])

    /**
     * @memberof hs.routing
     * @ngdoc controller
     * @name hs.routing.controller
     */
    .controller('hs.routing.controller', [
        '$scope',
        'hs.map.service',
        'Core',
        'layoutService',
        function($scope, OlMap, Core, layoutService) {

            // Set the instance of the OpenAPI that s4a.js
            // works towards
            //s4a.openApiUrl('http://localhost:8080/openapi');

            // Set an alias for the namepath to the Routing
            // module
            var Routing = s4a.analytics.Routing;

            // Assign the OpenLayers map object to a local variable
            var map = OlMap.map;

            // Declare a variable to control the click listener
            // for adding and removing it smoothly
            var singleClickListener;

            // Define the source of a vector layer to hold
            // routing calculataed features
            var gjSrc = new ol.source.Vector();

            // Define a format reader to parse WKT to OpenLayers features
            var gjFormat = new ol.format.GeoJSON();

            // Define the style to apply to the routing feature
            // layer
            var gjStyle = new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ff0000',
                    width: 3
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    fill: new ol.style.Fill({
                        color: '#ff0000'
                    })
                })
            });

            // Create a re-usable vector layer with the specific
            // source and style
            var gjLyr = new ol.layer.Vector({
                source: gjSrc,
                style: gjStyle
            });

            /**
             * (PRIVATE) Utility function to transform forward/inverse between 4326 - 3857
             * @memberof hs.routing.controller
             * @function trans
             * @param {ol.coordinate} coordinate Coordinate to transform
             * @param {Boolean} inverse Direction of transformation (true = 3857 -> 4326, false = 4326 -> 3857)
             * @returns {ol.coordinate} p Transformated coordinate
             */
            var trans = function(coordinate, inverse) {
                var p = null;
                if (inverse === true) {
                    p = ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326');
                } else {
                    p = ol.proj.transform(coordinate, 'EPSG:4326', 'EPSG:3857');
                }
                return p;
            };

            // Name of the currently selected operation
            $scope.operation = '';

            // Default values for reachable area calculations
            $scope.reachableArea = {
                distance: '5000'
            };

            $scope.optimalRoute = {
                isLoop: true
            };

            /**
             * Set the default operation (Shortest route)
             * @memberof hs.routing.controller
             * @function setDefaultOperation
             */
            var setDefaultOperation = function() {
                $scope.operation = "ShortestRoute";
            };

            // Array to hold search results
            $scope.searchResults = [];

            // Array to hold way points
            $scope.wayPoints = [];

            /**
             * Set routing operation and remove previous results and waypoints
             * @memberof hs.routing.controller
             * @function setOperation
             * @param {String} operation Selected operation
             */
            $scope.setOperation = function(operation) {
                $scope.clearAll();
                $scope.clearWayPoints();
                $scope.clearSearchResults();
                $scope.operation = operation;
                if (!$scope.$$phase) $scope.$digest();
            }

            /**
             * Clear route's vector source
             * @memberof hs.routing.controller
             * @function clearAll
             */
            $scope.clearAll = function() {
                setDefaultOperation();
                gjSrc.clear();
            };

            /**
             * Clear drawn waypoints
             * @memberof hs.routing.controller
             * @function clearWayPoints
             */
            $scope.clearWayPoints = function() {
                $scope.wayPoints.length = 0;
                gjSrc.clear();
                if (!$scope.$$phase) $scope.$digest();
            };

            /**
             * Clear current search results
             * @memberof hs.routing.controller
             * @function clearSearchResults
             */
            $scope.clearSearchResults = function() {
                $scope.searchResults.length = 0;
            };

            /**
             * (PRIVATE) Click handler for clicks, call handler by operation
             * @memberof hs.routing.controller
             * @function clickHandler
             * @param {ol.click.event} evt
             */
            var clickHandler = function(evt) {
                if ($scope.operation === 'ShortestRoute') {
                    shortestRouteClickHandler(evt);
                } else if ($scope.operation === 'ReachableArea') {
                    reachableAreaClickHandler(evt);
                } else if ($scope.operation === 'OptimalRoute') {
                    optimalRouteClickHandler(evt);
                }
            };

            /**
             * (PRIVATE) Handler to be invoked when the shortest route operation is activated
             * @memberof hs.routing.controller
             * @function shortestRouteClickHandler
             * @param {ol.ClickEvent} evt 
             */
            var shortestRouteClickHandler = function(evt) {
                // Reset if two or more way points
                if ($scope.wayPoints.length >= 2) {
                    $scope.clearWayPoints();
                }
                addWayPoint(evt.coordinate);
            };

            /**
             * (PRIVATE) Handler to be invoked when the optimal route operation is activated
             * @memberof hs.routing.controller
             * @function optimalRouteClickHandler
             * @param {ol.ClickEvent} evt 
             */
            var optimalRouteClickHandler = function(evt) {
                addWayPoint(evt.coordinate);
            };

            /**
             * Optimaze route for waypoints
             * @memberof hs.routing.controller
             * @function optimizeRoute
             */
            $scope.optimizeRoute = function() {
                gjSrc.clear();
                if ($scope.wayPoints.length < 3) {
                    console.log('This does not make sense with less than 3 points');
                    return;
                } else {

                    var nodeIds = $scope.wayPoints.map(function(d) {
                        return d.id;
                    });
                    var start = $scope.wayPoints[0].id;

                    var finish;

                    if ($scope.optimalRoute.isLoop === true) {
                        finish = start;
                    } else {
                        finish = $scope.wayPoints[$scope.wayPoints.length - 1].id;
                    }

                    var move = function(array, from, to) {
                        if (to === from)
                            return;

                        var target = array[from];
                        var increment = to < from ? -1 : 1;

                        for (var k = from; k != to; k += increment) {
                            array[k] = array[k + increment];
                        }
                        array[to] = target;
                        return array;
                    }

                    /**
                    * Move selected waypoint up in order
                    * @memberof hs.routing.controller
                    * @function moveUp
                    * @param {Number} from Current position of waypoint in order
                    */
                    $scope.moveUp = function(from) {
                        move($scope.wayPoints, from, from - 1);
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }

                    /**
                    * Move selected waypoint down in order
                    * @memberof hs.routing.controller
                    * @function moveDown
                    * @param {Number} from Current position of waypoint in order
                    */
                    $scope.moveDown = function(from) {
                        move($scope.wayPoints, from, from + 1);
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }

                    Routing.getOptimalRoute(nodeIds, start, finish)
                        .then(function(res) {
                            var nodes = res.data;
                            if ($scope.optimalRoute.isLoop === true) {
                                nodes.push(nodes[0]);
                            }
                            for (var i = 0; i < nodes.length - 1; i++) {
                                Routing.getShortestRoute(nodes[i].id, nodes[i + 1].id)
                                    .then(function(res) {
                                        for (var f = 0; f < res.data.length; f++) {
                                            var feat = gjFormat.readFeature(res.data[f], {
                                                featureProjection: 'EPSG:3857'
                                            });
                                            gjSrc.addFeature(feat);
                                        }
                                    });
                            }

                        });
                }

            };

            /**
             * (PRIVATE) Handler to be invoked when the reachable area operation is activated
             * @memberof hs.routing.controller
             * @function reachableAreaClickHandler 
             * @param {ol.ClickEvent} evt
             */
            var reachableAreaClickHandler = function(evt) {

                var lonlat = trans(evt.coordinate, true);

                Routing.getNearestNode(lonlat[0], lonlat[1])
                    .then(function(res) {
                        if (res.status === 'success' && res.count > 0) {
                            getReachableArea(res.data.id, +$scope.reachableArea.distance);
                        }
                    });
            };

            /**
             * (PRIVATE) Add a way point to the list (computes Route for Shortest route operation)
             * @memberof hs.routing.controller
             * @function addWayPoint 
             * @param {ol.coordinate} coordinate
             */
            var addWayPoint = function(coordinate) {
                var lonlat = trans(coordinate, true);
                Routing.getNearestNode(lonlat[0], lonlat[1], 100)
                    .then(function(res) {
                        if (res.status === 'success') {
                            gjSrc.addFeature(new ol.Feature({
                                geometry: new ol.geom.Point(trans([res.data.lon, res.data.lat]))
                            }));

                            $scope.wayPoints.push(jQuery.extend({}, res.data));

                            if ($scope.operation === 'ShortestRoute' && $scope.wayPoints.length == 2) {
                                getShortestRoute($scope.wayPoints[0].id, $scope.wayPoints[1].id);
                            }
                            if (!$scope.$$phase) $scope.$digest();
                        }
                    });
            };

            /**
             * (PRIVATE) Get route description as street list with their lengths
             * @memberof hs.routing.controller
             * @function getRouteDescription 
             * @param {GeoJSON} geoJsonFeatures
             * @returns {array} description List of streetnames and distances 
             */
            var getRouteDescription = function(geoJsonFeatures) {

                var description = [];

                var descLine = {
                    streetname: null,
                    distance: 0
                };

                var previousStreetname;
                var count = 0;
                for (var i = 0; i < geoJsonFeatures.length; i++) {

                    var f = geoJsonFeatures[i];
                    if ((f.properties.streetname !== previousStreetname && count > 0) ||
                        count === geoJsonFeatures.length - 1) {
                        description.push(jQuery.extend({}, descLine));
                    }

                    if (f.properties.streetname !== previousStreetname) {
                        descLine.streetname = f.properties.streetname !== '' ? f.properties.streetname : '<unnamed street>';
                        descLine.distance = f.properties.distance;
                    } else {
                        descLine.distance += (+f.properties.distance);
                    }

                    previousStreetname = f.properties.streetname;

                    count++;
                }
                return description;

            };

            /**
             * (PRIVATE) Calculate the shortest route
             * @memberof hs.routing.controller
             * @function getShortestRoute 
             * @param {Number} fromNode - Identifier of from node
             * @param {Number} toNode - Identifier of to node
             */
            var getShortestRoute = function(fromNode, toNode) {
                Routing.getShortestRoute(fromNode, toNode)
                    .then(function(res) {
                        if (res.status === 'success' && res.count > 0) {
                            $scope.clearSearchResults();
                            for (var i = 0; i < res.data.length; i++) {
                                var feature = gjFormat.readFeature(res.data[i], {
                                    featureProjection: 'EPSG:3857'
                                });
                                gjSrc.addFeature(feature);
                            }
                            $scope.searchResults.length = 0;
                            jQuery.extend($scope.searchResults, getRouteDescription(res.data));
                            if (!$scope.$$phase) $scope.$digest();
                        }
                    });
            };

            /**
             * (PRIVATE) Calculate reachable area
             * @memberof hs.routing.controller
             * @function getReachableArea 
             * @param {Number} fromNode Node to compute area
             * @param {Number} distance Maximum distance of area
             */
            var getReachableArea = function(fromNode, distance) {
                Routing.getReachableArea(fromNode, distance)
                    .then(function(res) {
                        gjSrc.clear();
                        var f = gjFormat.readFeature(res.feature, {
                            featureProjection: 'EPSG:3857'
                        });
                        f.set('hs_notqueryable', true);
                        gjSrc.addFeature(f);
                    });
            };

            /**
            * Activate route layer and routing interaction
            * @memberof hs.routing.controller
            * @function activate
            */
            $scope.activate = function() {
                map.addLayer(gjLyr);
                singleClickListener = map.on('singleclick', clickHandler);
            };

            /**
            * Deactivate route layer and routing interaction, clear data
            * @memberof hs.routing.controller
            * @function deactivate
            */
            $scope.deactivate = function() {
                map.removeLayer(gjLyr);
                gjSrc.clear();
                map.unByKey(singleClickListener);
                $scope.clearAll();
            };

            $scope.$on('core.mainpanel_changed', function(event) {
                if (layoutService.mainpanel === 'routing') {
                    setDefaultOperation();
                    $scope.activate();
                } else {
                    $scope.deactivate();
                }
            });

            $scope.$on('scope_loaded', function(event, data) {
                if (layoutService.mainpanel === 'routing' && data === 'routing') {
                    setDefaultOperation();
                    $scope.activate();
                } else {
                    $scope.deactivate();
                }
            });

            $scope.$emit('scope_loaded', "routing");

        }
    ]);
})
