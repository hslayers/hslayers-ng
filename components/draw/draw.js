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
                $scope.features = [];
                $scope.current_feature = null;
                $scope.type = 'Point';

                $scope.categories = {
                    'http://test#tree': 'Tree',
                    'http://test#building': 'Building'
                }

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
                            // set sketch

                            $scope.sketch = [evt.feature];
                            $scope.features.push({
                                type: $scope.type,
                                ol_feature: evt.feature
                            });
                            if ($scope.is_unsaved) return;
                            if (!$scope.$$phase) $scope.$digest();
                            $scope.setCurrentFeature($scope.features[$scope.features.length - 1], $scope.features.length - 1);
                        }, this);

                    draw.on('drawend',
                        function(evt) {
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

                $scope.newPointFromGps = function() {
                    //TODO get current lon/lat from mobile device GPS, create a point
                    var g_feature = new ol.geom.Point([lon, lat]); //TODO lon lat to be filled
                    var feature = new ol.Feature({
                        geometry: g_feature.getGeometry().transform('EPSG:4326', map.getView().getProjection()), //maybe transformation is not necessary
                    });
                    source.addFeature(feature);
                    $scope.features.push({
                        type: 'Point',
                        ol_feature: feature
                    });
                    if (!$scope.$$phase) $scope.$digest();
                    $scope.setCurrentFeature($scope.features[$scope.features.length - 1], $scope.features.length - 1);
                }

                $scope.highlightFeature = function(feature, state) {
                    feature.ol_feature.set('highlighted', state);
                }

                /**
                 * @function setCurrentFeature
                 * @memberOf hs.draw.controller
                 * @description Opens list of feature attributes 
                 * @param {object} feature - Wrapped feature to edit or view
                 * @param {number} index - Used to position the detail panel after layers li element
                 */
                $scope.setCurrentFeature = function(feature, index) {
                    if ($scope.is_unsaved) return;
                    if ($scope.current_feature == feature) {
                        $scope.current_feature = null;
                    } else {
                        $scope.current_feature = feature;
                        $(".hs-dr-editpanel").insertAfter($("#hs-dr-feature-" + index));
                        $(".hs-dr-editpanel").get(0).scrollIntoView();
                        var cf = $scope.current_feature;
                        var olf = cf.ol_feature;
                        //Fill feature container object, because we cant edit attributes in OL feature directly
                        angular.forEach(olf.getKeys(), function(key) {
                            if (key != 'geometry' && key != 'highlighted') {
                                cf[key] = olf.get(key);
                            }
                        });
                    }
                    return false;
                }

                $scope.saveFeature = function() {
                    var cf = $scope.current_feature;
                    var olf = cf.ol_feature;
                    olf.set('name', cf.name);
                    olf.set('description', cf.description);
                    olf.set('category', cf.category);
                    angular.forEach(cf.extra_attributes, function(attr) {
                        olf.set(attr.name, attr.value);
                    });
                    $scope.is_unsaved = false;
                }

                $scope.setUnsaved = function() {
                    $scope.is_unsaved = true;
                }

                $scope.cancelChanges = function() {
                    $scope.is_unsaved = false;
                    $scope.current_feature = null;
                }

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

                $scope.removeFeature = function(feature) {
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
