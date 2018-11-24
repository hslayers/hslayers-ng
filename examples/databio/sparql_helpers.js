define(['ol'],

    function(ol) {

        var me = {
            fillFeatures: function(src, geom_name, response, id_field, attrs, map, $scope) {
                if (angular.isUndefined(response.results)) return;
                var features = [];
                var format = new ol.format.WKT();
                src.getFeatures().forEach(function(feature) {
                    feature._flaged_for_removal = true;
                })
                for (var i = 0; i < response.results.bindings.length; i++) {
                    try {
                        var b = response.results.bindings[i];
                        if (b[geom_name].datatype == "http://www.openlinksw.com/schemas/virtrdf#Geometry" && b[geom_name].value.indexOf('e+') == -1 && b[geom_name].value.indexOf('e-') == -1) {
                            if (src.getFeatureById(b[id_field].value) == null) {
                                var g_feature = format.readFeature(b[geom_name].value.toUpperCase());
                                var geom_transformed = g_feature.getGeometry().transform('EPSG:4326', map.getView().getProjection());
                                var fields = {
                                    geometry: geom_transformed
                                };
                                for (key in attrs) {
                                    if (typeof b[attrs[key]] == 'undefined') {
                                        console.error('Missing key', key);
                                    } else {
                                        fields[key] = b[attrs[key]].value;
                                    }
                                }
                                var feature = new ol.Feature(fields);
                                feature.setId(b[id_field].value);
                                features.push(feature);
                            } else {
                                src.getFeatureById(b[id_field].value)._flaged_for_removal = false;
                            }
                        }
                    } catch (ex) {
                        console.log(ex);
                    }
                }
                src.addFeatures(features);
                src.getFeatures().forEach(function(feature) {
                    if (feature._flaged_for_removal) src.removeFeature(feature);
                })
                me.completeLoading(src, $scope);
            },
            startLoading(src, $scope) {
                src.set('loaded', false);
                src.loaded = false;
                if (!$scope.$$phase) $scope.$apply();
            },
            completeLoading(src, $scope) {
                src.set('loaded', true);
                src.loaded = true;
                if (!$scope.$$phase) $scope.$apply();
                src.dispatchEvent('features:loaded', src);
            },
            zoomToFetureExtent(src, camera, map) {
                if (src.getFeatures().length > 0) {
                    var extent = src.getFeatures()[0].getGeometry().getExtent().slice(0);
                    src.getFeatures().forEach(function(feature) {
                        ol.extent.extend(extent, feature.getGeometry().getExtent())
                    });
                    extent = ol.proj.transformExtent(extent, map.getView().getProjection(), 'EPSG:4326');
                    camera.flyTo({
                        destination: Cesium.Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3])
                    })
                }

            }
        }
        return me;

    }

)
