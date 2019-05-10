/**
 * @namespace hs.legend
 * @memberOf hs
 */
define(['angular', 'ol', 'map', 'utils'], function (angular, ol) {
    var module = angular.module('hs.legend', ['hs.map', 'hs.utils']);

    module.directive('hs.legend.layerDirective', ['config', function (config) {
        return {
            template: require('components/legend/partials/layer-directive.html'),
            scope: {
                layer: '=',
            }
        };
    }]);

    module.service('hs.legend.service', ['hs.utils.service', function (utils) {
        var me = {};
        return angular.extend(me, {

            /** 
             * Test if layer is visible and has supported type (conditions for displaying legend)
             * @memberof hs.legend.service
             * @function isLegendable
             * @param {object} layer Layer to test
             * @returns {Boolean}
             */
            isLegendable: function (layer) {
                if (['vector', 'wms'].indexOf(layer.type) > -1 && layer.lyr.getVisible()) return true;
                return false;
            },

            /**
             * Generate url for GetLegendGraphic request of WMS service for selected layer
             * @memberof hs.legend.service
             * @function getLegendUrl
             * @param {ol.source.Source} source Source of wms layer
             * @param {string} layer_name Name of layer for which legend is requested
             */
            getLegendUrl: function (source, layer_name) {
                var source_url = "";
                if (source instanceof ol.source.TileWMS) {
                    source_url = source.getUrls()[0]
                } else if (source instanceof ol.source.ImageWMS) {
                    source_url = source.getUrl()
                } else {
                    return ""
                }
                if (source_url.indexOf('proxy4ows') > -1) {
                    var params = utils.getParamsFromUrl(source_url);
                    source_url = params.OWSURL;
                }
                var version = '1.3.0';
                if (source.getParams().VERSION) version = source.getParams().VERSION;
                source_url += (source_url.indexOf('?') > 0 ? '' : '?') + "&version=" + version + "&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + layer_name + "&format=image%2Fpng";
                source_url = utils.proxify(source_url, false);
                return source_url;
            },

            /**
             * (PRIVATE) Generate url for GetLegendGraphic request of WMS service for selected layer
             * @memberof hs.legend.service
             * @function getLegendUrl
             * @param {string} source_url Url of service
             * @param {string} layer_name Name of layer for which legend is requested
             */
            getLayerLegendDescriptor: function (layer) {
                if (layer.getSource() instanceof ol.source.TileWMS || layer.getSource() instanceof ol.source.ImageWMS) {
                    var subLayerLegends = layer.getSource().getParams().LAYERS.split(",");
                    for (var i = 0; i < subLayerLegends.length; i++) {
                        subLayerLegends[i] = me.getLegendUrl(layer.getSource(), subLayerLegends[i]);
                    }
                    return {
                        title: layer.get("title"),
                        lyr: layer,
                        type: 'wms',
                        subLayerLegends: subLayerLegends,
                        visible: layer.getVisible()
                    };
                } else if (layer.getSource().legend_categories) {
                    return {
                        title: layer.get("title"),
                        lyr: layer,
                        type: 'vector',
                        visible: layer.getVisible()
                    };
                } else return undefined;
            }
        })
    }]);


    /**
     * @memberof hs.legend
     * @ngdoc component
     * @name hs.legend.component
     * @description Add legend panel (display available legends for displayed layers) to sidebar
     */
    module.component('hs.legend', {
        template: require('components/legend/partials/legend.html'),
        controller: ['$scope', 'hs.map.service', '$rootScope', 'hs.legend.service', function ($scope, OlMap, $rootScope, service) {
            var map;

            angular.extend($scope, {
                layerDescriptors: [],

                /**
                 * Add selected layer to the list of layers in legend (with event listener 
                 * to display/hide legend item when layer visibility change)
                 * @memberof hs.legend.controller
                 * @function addLayerToLegends
                 * @param {object} layer Layer to add legend for 
                 */
                addLayerToLegends: function (layer) {
                    var descriptor = service.getLayerLegendDescriptor(layer);
                    if (descriptor) {
                        $scope.layerDescriptors.push(descriptor);
                        layer.on('change:visible', layerVisibilityChanged);
                    }
                },

                /**
                 * Remove selected layer from legend items
                 * @memberof hs.legend.controller
                 * @function removeLayerFromLegends
                 * @param {Ol.layer} layer Layer to remove from legend
                 */
                removeLayerFromLegends: function (layer) {
                    for (var i = 0; i < $scope.layerDescriptors.length; i++) {
                        if ($scope.layerDescriptors[i].lyr == layer) {
                            $scope.layerDescriptors.splice(i, 1);
                            break;
                        }
                    }
                },

                /** 
                * Refresh event listeners UNUSED
                * @memberof hs.legend.controller
                * @function refresh
                */
                refresh: function () {
                    if (!$scope.$$phase) $scope.$digest();
                },

                isLegendable: service.isLegendable
            });

            function init() {
                map = OlMap.map;
                map.getLayers().on("add", layerAdded);
                map.getLayers().on("remove", function (e) {
                    $scope.removeLayerFromLegends(e.element);
                });
                map.getLayers().forEach(function (lyr) {
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
            function layerAdded(e) {
                $scope.addLayerToLegends(e.element);
            };

            function layerVisibilityChanged(e) {
                for (var i = 0; i < $scope.layerDescriptors.length; i++) {
                    if ($scope.layerDescriptors[i].layer == e.target) {
                        $scope.layerDescriptors[i].visible = e.target.getVisible();
                        break;
                    }
                }
            }

            if (OlMap.map)
                init();
            else
                $rootScope.$on('map.loaded', function () {
                    init()
                });

            $scope.$emit('scope_loaded', "Legend");
        }]
    });
});
