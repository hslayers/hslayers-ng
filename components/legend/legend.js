/**
 * @namespace hs.legend
 * @memberOf hs
 */
define(['angular', 'ol', 'map'],

    function(angular, ol) {
        angular.module('hs.legend', ['hs.map'])
            .directive('hs.legend.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/legend/partials/legend.html'
                };
            })

        .controller('hs.legend.controller', ['$scope', 'hs.map.service',
            function($scope, OlMap) {
                var map = OlMap.map;
                var layerAdded = function(e) {
                    $scope.addLayerToLegends(e.element);
                };

                $scope.layers = [];

                $scope.addLayerToLegends = function(layer) {
                    if (layer.getSource() instanceof ol.source.TileWMS || layer.getSource() instanceof ol.source.ImageWMS) {
                        var sub_layers = layer.getSource().getParams().LAYERS.split(",");
                        for (var i = 0; i < sub_layers.length; i++) {
                            if (layer.getSource() instanceof ol.source.TileWMS) {
                                sub_layers[i] = $scope.getWmsLayerLegendUrl(layer.getSource().getUrls()[0], sub_layers[i]);
                            } else if (layer.getSource() instanceof ol.source.ImageWMS) {
                                sub_layers[i] = $scope.getWmsLayerLegendUrl(layer.getSource().getUrl(), sub_layers[i]);
                            }
                        }
                        layer.on('change:visible', function(e) {
                            for (var i = 0; i < $scope.layers.length; i++) {
                                if ($scope.layers[i].layer == e.target) {
                                    $scope.layers[i].visible = e.target.getVisible();
                                    break;
                                }
                            }
                            if (!$scope.$$phase) $scope.$digest();
                        })
                        $scope.layers.push({
                            title: layer.get("title"),
                            layer: layer,
                            type: 'wms',
                            sub_layers: sub_layers,
                            visible: layer.getVisible()
                        });
                    } else if (layer.getSource().legend_categories) {
                        layer.on('change:visible', function(e) {
                            for (var i = 0; i < $scope.layers.length; i++) {
                                if ($scope.layers[i].layer == e.target) {
                                    $scope.layers[i].visible = e.target.getVisible();
                                    break;
                                }
                            }
                            if (!$scope.$$phase) $scope.$digest();
                        })
                        $scope.layers.push({
                            title: layer.get("title"),
                            lyr: layer,
                            type: 'vector',
                            visible: layer.getVisible()
                        });
                    }

                }

                /*
                 * Generates URL for requesting the legend
                 * @param {string} wms_url - WMS service url
                 * @param {string} layer_name - Name of the sub-layer
                 */
                $scope.getWmsLayerLegendUrl = function(wms_url, layer_name) {
                    return wms_url + (wms_url.indexOf('?') > 0 ? '' : '?') + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + layer_name + "&format=image%2Fpng";
                }

                $scope.removeLayerFromLegends = function(layer) {
                    for (var i = 0; i < $scope.layers.length; i++) {
                        if ($scope.layers[i].layer == layer) {
                            $scope.layers.splice(i, 1);
                            break;
                        }
                    }
                }

                $scope.refresh = function() {
                    if (!$scope.$$phase) $scope.$digest();
                }

                OlMap.map.getLayers().forEach(function(lyr) {
                    layerAdded({
                        element: lyr
                    });
                })
                map.getLayers().on("add", layerAdded);
                map.getLayers().on("remove", function(e) {
                    $scope.removeLayerFromLegends(e.element);
                });
                $scope.$emit('scope_loaded', "Legend");
            }
        ]);

    });
