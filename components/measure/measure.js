/**
 * @namespace hs.measure
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core'],

    function(angular, ol) {
        angular.module('hs.measure', ['hs.map', 'hs.core'])

        /**
         * @memberof hs.measure
         * @ngdoc directive
         * @name hs.measure.directive
         * @description Add measure html template of measuring distance or area to the map
         */
        .directive('hs.measure.directive', function() {
            return {
                templateUrl: hsl_path + 'components/measure/partials/measure.html?bust=' + gitsha
            };
        })

        /**
         * @memberof hs.measure
         * @ngdoc controller
         * @name hs.measure.controller
         */
        .controller('hs.measure.controller', ['$scope', 'hs.map.service', 'Core',
            function($scope, OlMap, Core) {

                var map = OlMap.map;

                var source = new ol.source.Vector({});
                var style = new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 2
                    })
                });

                var vector = new ol.layer.Vector({
                    source: source,
                    style: style
                });


                /**
                 * (PRIVATE) Handler of pointer movement, compute live results of measuring
                 * @memberof hs.measure.controller
                 * @function mouseMoveHandler 
                 * @param {Event} evt
                 */
                var mouseMoveHandler = function(evt) {
                    if ($scope.sketch) {
                        var output;

                        for (var i = 0; i < $scope.sketch.length; i++) {
                            var geom = $scope.sketch[i].getGeometry();
                            if (geom instanceof ol.geom.Polygon) {
                                output = addMultiple(formatArea(geom),output);
                            } else if (geom instanceof ol.geom.LineString) {
                                output = addMultiple(formatLength(geom),output);
                            }
                        }

                        $scope.measurements[$scope.current_measurement] = output;
                        if (!$scope.$$phase) $scope.$digest();
                    }
                };

                /**
                 * (PRIVATE) Add two measure results for multiple shape mode to display joined result
                 * @memberof hs.measure.controller
                 * @function addMultiple 
                 * @param {object} val1 Output of new object
                 * @param {object} val2 Old value
                 */
                var addMultiple = function(val1, val2) {
                    if (val2 == undefined) return val1;
                    var unit = val1.unit;
                    var type = val1.type;
                    if (val1.unit == val2.unit) {
                        var value = Math.round((val1.size + val2.size) * 100) / 100;
                        if (unit == "m" && type == "length" && value > 1000) {
                            value = Math.round(value / 1000 * 100) / 100;
                            unit = "km";
                        }
                        else if (unit == "m" && type == "area" && value > 10000) {
                            value = Math.round(value / 1000000 * 100) / 100;
                            unit = "km";
                        }
                    }
                    else {
                        var arr = [val1, val2];
                        for (var i= 0; i < arr.length; i++) {
                            if (arr[i].unit == "m") {
                                type == "length" ? arr[i].size /= 1000 : arr[i].size /= 1000000;
                            }
                        }
                        var value = Math.round((arr[0].size + arr[1].size) * 100) / 100;
                        unit = "km";
                    }
                    var output = {
                        size: value,
                        type: type,
                        unit: unit
                    };
                    return output;
                };
                
                $scope.multiple_shape_mode = false;
                $(document).keyup(function(e) {
                    if (e.which == 17) {
                        if ($scope.multiple_shape_mode == true) {
                            drawReset();   
                        }
                        $scope.multiple_shape_mode = !$scope.multiple_shape_mode;
                        $scope.$digest();
                    }
                });

                var draw; // global so we can remove it later
                var active; //temporary watcher if user is currently drawing - for clearing, think OL should have tool for this?

                /**
                 * (PRIVATE) Initialize draw interaction on Ol.map and event handlers for handling start and end of drawing
                 * @memberof hs.measure.controller
                 * @function addInteraction
                 */
                function addInteraction() {
                    var type = ($scope.type == 'area' ? 'Polygon' : 'LineString');
                    draw = new ol.interaction.Draw({
                        source: source,
                        type: /** @type {ol.geom.GeometryType} */ (type)
                    });
                    map.addInteraction(draw);

                    draw.on('drawstart',
                        function(evt) {
                            $("#toolbar").fadeOut();
                            // set sketch
                            if ($scope.multiple_shape_mode) {
                                if (!Array.isArray($scope.sketch)) {
                                    $scope.sketch = [];
                                    $scope.measurements.push({
                                        size: 0,
                                        unit: ""
                                    });
                                }
                                $scope.sketch.push(evt.feature);
                            }
                            else {
                                $scope.sketch = [evt.feature];
                                $scope.measurements.push({
                                    size: 0,
                                    unit: ""
                                });
                            }
                            $scope.current_measurement = $scope.measurements.length - 1;
                            active = true;
                        }, this);

                    draw.on('drawend',
                        function(evt) {
                            $("#toolbar").fadeIn();
                            active = false;
                        }, this);
                }

                var wgs84Sphere = new ol.Sphere(6378137);

                /**
                 * (PRIVATE) Compute and format line length with correct units (m/km)
                 * @memberof hs.measure.controller
                 * @function formatLength
                 * @param {ol.geom.LineString} line
                 * @return {object} numeric length of line with used units
                 */
                var formatLength = function(line) {
                    var length = 0;
                    var coordinates = line.getCoordinates();
                    var sourceProj = OlMap.map.getView().getProjection();


                    for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
                        var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
                        var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
                        length += wgs84Sphere.haversineDistance(c1, c2);
                    }

                    var output = {
                        size: length,
                        type: 'length',
                        unit: 'm'
                    };

                    if (length > 100) {
                        output.size = (Math.round(length / 1000 * 100) / 100);
                        output.unit = 'km';
                    } else {
                        output.size = (Math.round(length * 100) / 100);
                        output.unit = 'm';
                    }
                    return output;
                };

                /**
                 * (PRIVATE) Compute and format polygon area with correct units (m/km)
                 * @memberof hs.measure.controller
                 * @function formatArea
                 * @param {ol.geom.Polygon} polygon
                 * @return {object} area of polygon with used units
                 */
                var formatArea = function(polygon) {
                    var sourceProj = OlMap.map.getView().getProjection();
                    var geom = /** @type {ol.geom.Polygon} */ (polygon.clone().transform(sourceProj, 'EPSG:4326'));
                    var coordinates = geom.getLinearRing(0).getCoordinates();
                    area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
                    var output = {
                        size: area,
                        type: 'area',
                        unit: 'm'
                    };
                    if (area > 10000) {
                        output.size = (Math.round(area / 1000000 * 100) / 100);
                        output.unit = 'km';
                    } else {
                        output.size = (Math.round(area * 100) / 100);
                        output.unit = 'm';
                    }
                    return output;
                };

                $scope.measurements = [];
                $scope.current_measurement = {};
                $scope.type = 'distance';

                /**
                 * Set type of current measurment 
                 * @memberof hs.measure.controller
                 * @function setType
                 * @param {string} type type of measure to use, should be "area" or "distance"
                 */
                $scope.setType = function(type) {
                    $scope.type = type;
                    if (!$scope.$$phase) $scope.$digest();
                }

                /**
                 * Clear current drawings
                 * @memberof hs.measure.controller
                 * @function clearAll
                 * @description Reset sketch and all measurements to start new drawing
                 */
                $scope.clearAll = function() {
                    if (active) draw.finishDrawing();
                    $scope.measurements = [];
                    source.clear();
                    $scope.sketch = null;
                    if (!$scope.$$phase) $scope.$digest();
                }

                /**
                 * Change style of drawing in the map
                 * @memberof hs.measure.controller
                 * @function setFeatureStyle
                 * @param {Array|Object} new_style Ol.style object for vector
                 */
                $scope.setFeatureStyle = function(new_style) {
                    style = new_style;
                    vector.setStyle(new_style);
                }

                $scope.$watch('type', function() {
                    if (Core.mainpanel != 'measure') return;
                    drawReset();
                });
                
                /**
                 * (PRIVATE) Restart interaction and nullify sketch, measure parameter change callback
                 * @memberof hs.measure.controller
                 * @function drawReset
                 */
                function drawReset() {
                    map.removeInteraction(draw);
                    $scope.sketch = null;
                    addInteraction();
                }
                
                /**
                 * Activate measuring function
                 * @memberof hs.measure.controller
                 * @function activateMeasuring
                 */
                $scope.activateMeasuring = function() {
                    map.addLayer(vector);
                    $(map.getViewport()).on('mousemove', mouseMoveHandler);
                    addInteraction();
                }

                /**
                 * Deactivate measuring function
                 * @memberof hs.measure.controller
                 * @function deactivateMeasuring
                 */
                $scope.deactivateMeasuring = function() {
                    $(map.getViewport()).off('mousemove');
                    map.removeInteraction(draw);
                    map.removeLayer(vector);
                }

                $scope.$on('core.mainpanel_changed', function(event) {
                    if (Core.mainpanel == 'measure') {
                        $scope.activateMeasuring();
                    } else {
                        $scope.deactivateMeasuring();
                    }
                });
                
                //Temporary fix when measure panel is loaded as deafult (e.g. reloading page with parameters in link)
                if (Core.mainpanel=="measure") {
                    Core.current_panel_queryable=false;
                    $scope.activateMeasuring();
                }
                
                $scope.$emit('scope_loaded', "Measure");
            }
        ]);
    })
