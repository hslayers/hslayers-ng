/**
 * @namespace hs.measure
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core'],

    function(angular, ol) {
        angular.module('hs.measure', ['hs.map', 'hs.core'])
            .directive('hs.measure.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/measure/partials/measure.html?bust=' + gitsha
                };
            })

        .controller('hs.measure.controller', ['$scope', 'hs.map.service', 'Core',
            function($scope, OlMap, Core) {
                var map = OlMap.map;
                $scope.sketch;

                var source = new ol.source.Vector({});
                var style = new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 2
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


                /**
                 * handle pointer move
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
                 * format length output
                 * @param {ol.geom.LineString} line
                 * @return {string}
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
                 * format length output
                 * @param {ol.geom.Polygon} polygon
                 * @return {string}
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

                $scope.setType = function(type) {
                    $scope.type = type;
                    if (!$scope.$$phase) $scope.$digest();
                }

                $scope.clearAll = function() {
                    $scope.measurements = [];
                    source.clear();
                    $scope.sketch = null;
                    if (!$scope.$$phase) $scope.$digest();
                }

                $scope.setFeatureStyle = function(new_style) {
                    style = new_style;
                    vector.setStyle(new_style);
                }

                $scope.$watch('type', function() {
                    if (Core.mainpanel != 'measure') return;
                    map.removeInteraction(draw);
                    addInteraction();
                });

                $scope.activateMeasuring = function() {
                    map.addLayer(vector);
                    $(map.getViewport()).on('mousemove', mouseMoveHandler);
                    addInteraction();
                }

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
