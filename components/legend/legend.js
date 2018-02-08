/**
 * @namespace hs.legend
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'utils'],

    function(angular, ol) {
        angular.module('hs.legend', ['hs.map', 'hs.utils'])
            /**
             * @memberof hs.legend
             * @ngdoc directive
             * @name hs.legend.directive
             * @description Add legend panel (display available legends for displayed layers) to sidebar
             */
            .directive('hs.legend.directive', ['config', function(config) {
                return {
                    templateUrl: `${hsl_path}components/legend/partials/legend${config.design || ''}.html?bust=${gitsha}`,
                };
            }])

        /**
         * @memberof hs.legend
         * @ngdoc controller
         * @name hs.legend.controller
         */
        .controller('hs.legend.controller', ['$scope', 'hs.map.service', 'hs.utils.service', '$rootScope',
            function($scope, OlMap, utils, $rootScope) {
                var map;

                function init(){
                    map = OlMap.map;
                    map.getLayers().on("add", layerAdded);
                    map.getLayers().on("remove", function(e) {
                        $scope.removeLayerFromLegends(e.element);
                    });
                    map.getLayers().forEach(function(lyr) {
                        layerAdded({
                            element: lyr
                        });
                    })
                }

                /**
                 * (PRIVATE) Callback function for adding layer to map, add layers legend
                 * @memberof hs.legend.controller
                 * @function layerAdded
                 * @param {Object} e Event object, should have element property
                 */
                var layerAdded = function(e) {
                    $scope.addLayerToLegends(e.element);
                };

                $scope.layers = [];

                /**
                 * (PRIVATE) Generate url for GetLegendGraphic request of WMS service for selected layer
                 * @memberof hs.legend.controller
                 * @function getLegendUrl
                 * @param {string} source_url Url of sevice
                 * @param {string} layer_name Name of layer for which legend is requested
                 */
                function getLegendUrl(source_url, layer_name) {
                    if (source_url.indexOf('proxy4ows') > -1) {
                        var params = utils.getParamsFromUrl(source_url);
                        source_url = params.OWSURL;
                    }
                    source_url += (source_url.indexOf('?') > 0 ? '' : '?') + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + layer_name + "&format=image%2Fpng";
                    source_url = utils.proxify(source_url, false);
                    return source_url;
                }

                /**
                 * Add selected layer to the list of layers in legend (with event listener to display/hide legend item when layer visibility change)
                 * @memberof hs.legend.controller
                 * @function addLayerToLegends
                 * @param {object} layer Layer to add legend for 
                 */
                $scope.addLayerToLegends = function(layer) {
                    if (layer.getSource() instanceof ol.source.TileWMS || layer.getSource() instanceof ol.source.ImageWMS) {
                        var sub_layers = layer.getSource().getParams().LAYERS.split(",");
                        for (var i = 0; i < sub_layers.length; i++) {
                            if (layer.getSource() instanceof ol.source.TileWMS) {
                                sub_layers[i] = getLegendUrl(layer.getSource().getUrls()[0], sub_layers[i]);
                            } else if (layer.getSource() instanceof ol.source.ImageWMS) {
                                sub_layers[i] = getLegendUrl(layer.getSource().getUrl(), sub_layers[i]);
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
                            lyr: layer,
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
                 * Generate url for GetLegendGraphic request of WMS service for selected layer
                 * @memberof hs.legend.controller
                 * @function getWmsLayerLegendUrl
                 * @param {string} wms_url Url of sevice
                 * @param {string} layer_name Name of layer for which legend is requested
                 */
                $scope.getWmsLayerLegendUrl = function(wms_url, layer_name) {
                    return wms_url + (wms_url.indexOf('?') > 0 ? '' : '?') + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + layer_name + "&format=image%2Fpng";
                }

                /*
                 * Remove selected layer from legend items
                 * @memberof hs.legend.controller
                 * @function removeLayerFromLegends
                 * @param {Ol.layer} layer Layer to remove from legend
                 */
                $scope.removeLayerFromLegends = function(layer) {
                    for (var i = 0; i < $scope.layers.length; i++) {
                        if ($scope.layers[i].layer == layer) {
                            $scope.layers.splice(i, 1);
                            break;
                        }
                    }
                }

                /*
                 * Refresh event listeners UNUSED
                 * @memberof hs.legend.controller
                 * @function refresh
                 */
                $scope.refresh = function() {
                    if (!$scope.$$phase) $scope.$digest();
                }

                /*
                 * Test if layer is visible and have selected type (conditions for displaying legend)
                 * @memberof hs.legend.controller
                 * @function hasLegend
                 * @param {object} layer Layer to test
                 * @param {string} type Type of layer
                 * @returns {Boolean}
                 */
                $scope.hasLegend = function(layer, type) {
                    if (layer.type == type && layer.lyr.getVisible()) return true;
                    if (layer.type == type && layer.lyr.getVisible()) return true;
                    return false;

                }

                if (OlMap.map) 
                    init();
                else
                    $rootScope.$on('map.loaded', function () {
                        init()
                    });
               
                $scope.$emit('scope_loaded', "Legend");
            }
        ]);

    });
