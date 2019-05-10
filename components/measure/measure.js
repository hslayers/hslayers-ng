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
        .directive('hs.measure.directive', ['config', function(config) {
            return {
                template: require('components/measure/partials/measure.html'),
            };
        }])
        /**
         * @memberof hs.measure
         * @ngdoc service
         * @name hs.measure.service
         */
        .service('hs.measure.service', ['$rootScope','hs.map.service',
            function($rootScope,OlMap){
                var me = this;
                
                var map;
                
                if (angular.isDefined(OlMap.map)) map = OlMap.map;
                else $rootScope.$on('map.loaded', function(){
                    map = OlMap.map;
                });
                
                this.draw;
                
                this.measureVector = new ol.layer.Vector({
                    source: new ol.source.Vector(),
                    style: new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(255, 255, 255, 0.2)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: '#ffcc33',
                            width: 2
                        })
                    })
                });
                
                this.data = {};
                
                this.data.measurements = [];
                
                this.data.multipleShapeMode = false;
                
                this.sketch = {};
                
                this.currentMeasurement;
                
                /**
                 * @memberof hs.measure.service
                 * @function switchMultipleMode
                 * @public
                 * @param {Boolean} mode Optional parameter if multiple shape mode should be enabled 
                 * @description Enable/disable multiple shape mode for measuring (switch without parameter)
                 */
                this.switchMultipleMode = function(mode) {
                    if (angular.isDefined(mode)) me.data.multipleShapeMode = mode;
                    else me.data.multipleShapeMode = !me.data.multipleShapeMode;
                }
                
                /**
                 * @memberof hs.measure.service
                 * @function changeMeasureParams
                 * @public
                 * @param {String} type Geometry type of measurement ('area' for polygon, 'line' for linestring) 
                 * @description Change geometry type of measurement without deleting of old ones
                 */
                this.changeMeasureParams = function(type) {
                    map.removeInteraction(me.draw);
                    me.sketch = null;
                    addInteraction(type);
                }
                
                /**
                 * @memberof hs.measure.service
                 * @function clearMeasurement
                 * @public
                 * @description Clear all measurements and restart measuring
                 */
                this.clearMeasurement = function() {
                    me.draw.setActive(false);
                    me.data.measurements.length = 0;
                    me.measureVector.getSource().clear();
                    me.sketch = null;
                    me.draw.setActive(true);
                }
                
                /**
                 * @memberof hs.measure.service
                 * @function activateMeasuring
                 * @public
                 * @param {Boolean} mode Optional parameter, Geometry type of measurement ('area' for polygon, 'line' for linestring) Line is default
                 * @description Start measuring interaction in app
                 */
                this.activateMeasuring = function(type) {
                    map.addLayer(me.measureVector);
                    map.getViewport().addEventListener('mousemove', mouseMoveHandler);
                    addInteraction(type);
                }

                /**
                 * @memberof hs.measure.service
                 * @function deactivateMeasuring
                 * @public
                 * @description Stop measuring interaction in app
                 */
                this.deactivateMeasuring = function() {
                    map.getViewport().removeEventListener('mousemove', mouseMoveHandler);
                    map.removeInteraction(me.draw);
                    map.removeLayer(me.measureVector);
                }
                
                /**
                 * @memberof hs.measure.service
                 * @function mouseMoveHandler
                 * @private
                 * @param {Object} evt Callback param for mouse move event
                 * @description Callback for mouse move event, compute live measurement results
                 */
                var mouseMoveHandler = function(evt) {
                    if (me.sketch) {
                        var output;

                        for (var i = 0; i < me.sketch.length; i++) {
                            var geom = me.sketch[i].getGeometry();
                            if (geom instanceof ol.geom.Polygon) {
                                output = addMultiple(formatArea(geom),output);
                            } else if (geom instanceof ol.geom.LineString) {
                                output = addMultiple(formatLength(geom),output);
                            }
                        }


                        me.data.measurements[me.currentMeasurement] = output;
                        if (me.data.measurements[me.currentMeasurement])
                        me.data.measurements[me.currentMeasurement].geom = me.sketch;
                        if (!$rootScope.$$phase) $rootScope.$digest();
                    }
                };

                /**
                 * @memberof hs.measure.service
                 * @function addMultiple 
                 * @private
                 * @param {object} val1 Output of new object
                 * @param {object} val2 Old value
                 * @description Add two measure results for multiple shape mode to display joined result
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
                
                /**
                 * @memberof hs.measure.service
                 * @function addInteraction
                 * @private
                 * @param {Boolean} type Geometry type
                 * @description Initialize draw interaction on Ol.map and event handlers for handling start and end of drawing
                 */
                function addInteraction(type) {
                    var drawType = (type == 'area' ? 'Polygon' : 'LineString');
                    me.draw = new ol.interaction.Draw({
                        source: me.measureVector.getSource(),
                        type: /** @type {ol.geom.GeometryType} */ (drawType)
                    });
                    map.addInteraction(me.draw);

                    me.draw.on('drawstart',
                        function(evt) {
                            $rootScope.$broadcast('measure.drawStart');
                            if (me.data.multipleShapeMode) {
                                if (!Array.isArray(me.sketch)) {
                                    me.sketch = [];
                                    me.data.measurements.push({
                                        size: 0,
                                        unit: ""
                                    });
                                }
                                me.sketch.push(evt.feature);
                            }
                            else {
                                me.sketch = [evt.feature];
                                me.data.measurements.push({
                                    size: 0,
                                    unit: ""
                                });
                            }
                            me.currentMeasurement = me.data.measurements.length - 1;
                        });

                    me.draw.on('drawend',
                        function(evt) {
                            $rootScope.$broadcast('measure.drawEnd');
                        });
                }
                
                var wgs84Sphere = new ol.Sphere(6378137);
                
                /**
                 * @memberof hs.measure.service
                 * @function formatLength
                 * @private
                 * @param {ol.geom.LineString} line
                 * @return {object} numeric length of line with used units
                 * @description Compute and format line length with correct units (m/km)
                 */
                var formatLength = function(line) {
                    var length = 0;
                    var coordinates = line.getCoordinates();
                    var sourceProj = map.getView().getProjection();


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
                 * @memberof hs.measure.service
                 * @function formatArea
                 * @private
                 * @param {ol.geom.Polygon} polygon
                 * @return {object} area of polygon with used units
                 * @description Compute and format polygon area with correct units (m2/km2)
                 */
                var formatArea = function(polygon) {
                    var sourceProj = map.getView().getProjection();
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
            }
        ])
        /**
         * @memberof hs.measure
         * @ngdoc controller
         * @name hs.measure.controller
         */
        .controller('hs.measure.controller', ['$scope', 'hs.map.service', 'Core', 'hs.measure.service',
            function($scope, OlMap, Core, Measure) {
                $scope.data = Measure.data;

                document.addEventListener('keyup', function(e) {
                    if (e.keyCode == 17) { //ControlLeft
                        Measure.switchMultipleMode();
                        if (!$scope.$$phase) $scope.$digest();
                    }
                });

                $scope.$on('measure.drawStart', function(){
                    Core.panelEnabled('toolbar', false);
                });
                
                $scope.$on('measure.drawEnd', function(){
                    Core.panelEnabled('toolbar', true);
                });

                $scope.type = 'distance';

                /**
                 * @memberof hs.measure.controller
                 * @function setType
                 * @public
                 * @param {string} type type of measure to use, should be "area" or "distance"
                 * @return {object} area of polygon with used units
                 * @description Set type of current measurment
                 */
                $scope.setType = function(type) {
                    $scope.type = type;
                    Measure.switchMeasureType(type);
                    if (!$scope.$$phase) $scope.$digest();
                }

                /**
                 * @memberof hs.measure.controller
                 * @function clearAll
                 * @public
                 * @param {string} type type of measure to use, should be "area" or "distance"
                 * @return {object} area of polygon with used units
                 * @description Reset sketch and all measurements to start new drawing
                 */
                $scope.clearAll = function() {
                    Measure.clearMeasurement();
                    if (!$scope.$$phase) $scope.$digest();
                }

                $scope.$watch('type', function() {
                    if (Core.mainpanel != 'measure') return;
                    Measure.changeMeasureParams($scope.type);
                });

                $scope.$on('core.mainpanel_changed', function(event) {
                    if (Core.mainpanel == 'measure') {
                        Measure.activateMeasuring($scope.type);
                    } else {
                        Measure.deactivateMeasuring();
                    }
                });
                
                //Temporary fix when measure panel is loaded as deafult (e.g. reloading page with parameters in link)
                if (Core.mainpanel=="measure") {
                    Core.current_panel_queryable=false;
                    Measure.activateMeasuring($scope.type);
                }
                
                $scope.$emit('scope_loaded', "Measure");
            }
        ]);
    })
