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
                 * Handler of pointer movement, compute live results of measuring
                 * @memberof hs.measure.controller
                 * @function mouseMoveHandler 
                 * @param {Event} evt
                 */
                var mouseMoveHandler = function(evt) {
                    if ($scope.sketch) {
                        var output;
                        var val = 0;
                        for (var i = 0; i < $scope.sketch.length; i++) {
                            var geom = $scope.sketch[i].getGeometry();
                            if (geom instanceof ol.geom.Polygon) {
                                val += geom.getArea();
                            } else if (geom instanceof ol.geom.LineString) {
                                val += geom.getLength();
                            }
                        }
                        if (geom instanceof ol.geom.Polygon) {
                            output = formatArea(geom);
                        } else if (geom instanceof ol.geom.LineString) {
                            output = formatLength(geom);
                        }
                        $scope.measurements[$scope.current_measurement] = output;
                        if (!$scope.$$phase) $scope.$digest();
                    }
                };

                $scope.multiple_shape_mode = false;
                $(document).keyup(function(e) {
                    if (e.which == 17) {
                        $scope.multiple_shape_mode = !$scope.multiple_shape_mode;
                        $scope.$digest();
                    }
                });

                var draw; // global so we can remove it later
                
                /**
                * Initialize draw interaction on Ol.map and event handlers for handling start and end of drawing
                * memberof hs.measure.controller
                * function addInteraction
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
                            if ($scope.multiple_shape_mode)
                                $scope.sketch.push(evt.feature);
                            else {
                                $scope.sketch = [evt.feature];
                                $scope.measurements.push({
                                    size: 0,
                                    unit: ""
                                });
                            }
                            $scope.current_measurement = $scope.measurements.length - 1;
                        }, this);

                    draw.on('drawend',
                        function(evt) {
                            $("#toolbar").fadeIn();
                        }, this);
                }

                var wgs84Sphere = new ol.Sphere(6378137);

                /**
                 * Compute and format line length with correct units (m/km)
                 * @memberof hs.measure.controller
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
                 * Compute and format polygon area with correct units (m/km)
                 * @memberof hs.measure.controller
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
                * Clear current drawing
                * @memberof hs.measure.controller
                * @function clearAll
                * @description Reset sketch and measurement to start new drawing
                */
                $scope.clearAll = function() {
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
                    map.removeInteraction(draw);
                    addInteraction();
                });
                
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
                $scope.$emit('scope_loaded', "Measure");
            }
        ]);
    })
