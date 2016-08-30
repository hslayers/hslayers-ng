/**
 * @namespace hs.draw
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'core'],

    function(angular, ol) {
        angular.module('hs.draw', ['hs.map', 'hs.core'])
            .directive('hs.draw.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/draw/partials/draw.html?bust=' + gitsha
                };
            })

        .directive('hs.draw.toolbarButtonDirective', function() {
            return {
                templateUrl: hsl_path + 'components/draw/partials/toolbar_button_directive.html?bust=' + gitsha
            };
        })

        .controller('hs.draw.controller', ['$scope', 'hs.map.service', 'Core',
            function($scope, OlMap, Core) {
                var map = OlMap.map;

                var source = new ol.source.Vector({});
                var style = function(feature, resolution) {
                    return [new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: 'rgba(255, 255, 255, 0.2)'
                        }),
                        stroke: new ol.style.Stroke({
                            color: feature.get('highlighted') ? '#d00504' : '#ffcc33',
                            width: 2
                        }),
                        image: new ol.style.Circle({
                            radius: 5,
                            fill: new ol.style.Fill({
                                color: feature.get('highlighted') ? '#d11514' : '#ffcc33'
                            }),
                            stroke: new ol.style.Stroke({
                                color: feature.get('highlighted') ? '#d00504' : '#ff8e32',
                                width: 2
                            })
                        })
                    })]
                };

                var vector = new ol.layer.Vector({
                    source: source,
                    style: style
                });


                var draw; // global so we can remove it later
                function addInteraction() {
                    draw = new ol.interaction.Draw({
                        source: source,
                        type: /** @type {ol.geom.GeometryType} */ ($scope.type)
                    });
                    map.addInteraction(draw);

                    draw.on('drawstart',
                        function(evt) {
                            $("#toolbar").fadeOut();
                            // set sketch

                            $scope.sketch = [evt.feature];
                            $scope.features.push({
                                type: $scope.type,
                                ol_feature: evt.feature
                            });
                            if (!$scope.$$phase) $scope.$digest();
                            $scope.current_measurement = $scope.features.length - 1;
                        }, this);

                    draw.on('drawend',
                        function(evt) {
                            $("#toolbar").fadeIn();
                            if (!$scope.$$phase) $scope.$digest();
                        }, this);
                }

                $scope.setType = function(what) {
                    $scope.type = what;
                }

                $scope.stop = function() {
                    try {
                        if (draw.getActive()) draw.finishDrawing();
                    } catch (ex) {}
                    draw.setActive(false);
                }

                $scope.start = function() {
                    try {
                        if (draw.getActive()) draw.finishDrawing();
                    } catch (ex) {}
                    draw.setActive(true)
                }

                $scope.highlightFeature = function(feature, state) {
                    feature.ol_feature.set('highlighted', state);
                }

                $scope.features = [];
                $scope.current_measurement = {};
                $scope.type = 'Point';

                $scope.setType = function(type) {
                    $scope.type = type;
                    if (!$scope.$$phase) $scope.$digest();
                }

                $scope.clearAll = function() {
                    $scope.features = [];
                    source.clear();
                    $scope.sketch = null;
                    if (!$scope.$$phase) $scope.$digest();
                }
                
                $scope.removeFeature = function(feature){
                    $scope.features.splice($scope.features.indexOf(feature), 1);
                    source.removeFeature(feature.ol_feature);
                }

                $scope.setFeatureStyle = function(new_style) {
                    style = new_style;
                    vector.setStyle(new_style);
                }

                $scope.$watch('type', function() {
                    if (Core.mainpanel != 'draw') return;
                    map.removeInteraction(draw);
                    addInteraction();
                });

                $scope.activateDrawing = function() {
                    map.addLayer(vector);
                    addInteraction();
                }

                $scope.deactivateDrawing = function() {
                    map.removeInteraction(draw);
                    map.removeLayer(vector);
                }

                $scope.$on('core.mainpanel_changed', function(event) {
                    if (Core.mainpanel == 'draw') {
                        $scope.activateDrawing();
                    } else {
                        $scope.deactivateDrawing();
                    }
                });
                $scope.$emit('scope_loaded', "draw");
            }
        ]);
    })
