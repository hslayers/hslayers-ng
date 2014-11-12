define(['angular', 'map', 'toolbar'],

    function(angular) {
        angular.module('hs.measure', ['hs.map', 'hs.toolbar'])
            .directive('measure', function() {
                return {
                    templateUrl: hsl_path + 'components/measure/partials/measure.html'
                };
            })

        .controller('Measure', ['$scope', 'OlMap', 'ToolbarService',
            function($scope, OlMap, ToolbarService) {
                var map = OlMap.map;
                $scope.measurements = [];
                $scope.current_measurement = {};
                $scope.type = 'distance';

                var source = new ol.source.Vector({});

                var vector = new ol.layer.Vector({
                    source: source,
                    style: new ol.style.Style({
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
                    })
                });


                /**
                 * Currently drawed feature
                 * @type {ol.Feature}
                 */
                var sketch;

                /**
                 * handle pointer move
                 * @param {Event} evt
                 */
                var mouseMoveHandler = function(evt) {
                    if (sketch) {
                        var output;
                        var val = 0;
                        for (var i = 0; i < sketch.length; i++) {
                            var geom = sketch[i].getGeometry();
                            if (geom instanceof ol.geom.Polygon) {
                                val += geom.getArea();
                            } else if (geom instanceof ol.geom.LineString) {
                                val += geom.getLength();
                            }
                        }
                        if (geom instanceof ol.geom.Polygon) {
                            output = formatArea(val);
                        } else if (geom instanceof ol.geom.LineString) {
                            output = formatLength(val);
                        }
                        $scope.measurements[$scope.current_measurement] = output;
                        if (!$scope.$$phase) $scope.$digest();
                    }
                };

                $scope.ctrl_pressed = false;
                $(document).keyup(function(e) {
                    if (e.which == 17) {
                        $scope.ctrl_pressed = !$scope.ctrl_pressed;
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
                            if ($scope.ctrl_pressed)
                                sketch.push(evt.feature);
                            else {
                                sketch = [evt.feature];
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

                /**
                 * format length output
                 * @param {ol.geom.LineString} line
                 * @return {string}
                 */
                var formatLength = function(line) {
                    var length = Math.round(line * 100) / 100;
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
                var formatArea = function(area) {
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

                $scope.$watch('type', function() {
                    if (ToolbarService.mainpanel != 'measure') return;
                    map.removeInteraction(draw);
                    addInteraction();
                });

                $scope.$on('toolbar.mainpanel_changed', function(event) {
                    if (ToolbarService.mainpanel == 'measure') {
                        map.addLayer(vector);
                        $(map.getViewport()).on('mousemove', mouseMoveHandler);
                        addInteraction();
                    } else {
                        $(map.getViewport()).off('mousemove');
                        map.removeInteraction(draw);
                        map.removeLayer(vector);
                    }
                });

                $scope.clearAll = function() {
                    $scope.measurements = [];
                    source.clear();
                    sketch = null
                }


            }
        ]);
    })
