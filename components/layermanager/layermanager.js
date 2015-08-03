/**
 * @namespace hs.layermanager
 * @memberOf hs
 */
define(['angular', 'app', 'map', 'ol'], function(angular, app, map, ol) {
    angular.module('hs.layermanager', ['hs.map'])

    /**
     * @class hs.layermanager.directive
     * @memberOf hs.layermanager
     * @description Directive for displaying layer manager panel
     */
    .directive('hs.layermanager.directive', function() {
        return {
            templateUrl: hsl_path + 'components/layermanager/partials/layermanager.html'
        };
    })

    /**
     * @class hs.layermanager.removeAllDialogDirective
     * @memberOf hs.ows.wms
     * @description Directive for displaying warning dialog about resampling (proxying) wms service
     */
    .directive('hs.layermanager.removeAllDialogDirective', function() {
        return {
            templateUrl: hsl_path + 'components/layermanager/partials/dialog_removeall.html',
            link: function(scope, element, attrs) {
                $('#hs-remove-all-dialog').modal('show');
            }
        };
    })

    /**
     * @class hs.layermanager.controller
     * @memberOf hs.layermanager
     * @description Layer manager controller
     */
    .controller('hs.layermanager.controller', ['$scope', 'hs.map.service', 'box_layers', '$rootScope', 'Core', '$compile',
        function($scope, OlMap, box_layers, $rootScope, Core, $compile) {
            $scope.Core = Core;
            var map = OlMap.map;
            var cur_layer_opacity = 1;

            /**
             * @function layerAdded
             * @memberOf hs.layermanager.controller
             * @description Callback function for layer adding
             * @param {ol.CollectionEvent} e - Events emitted by ol.Collection instances are instances of this type.
             */
            var layerAdded = function(e) {
                if (e.element.get('show_in_manager') != null && e.element.get('show_in_manager') == false) return;
                var sub_layers;
                if (e.element.getSource().getParams) { // Legend only for wms layers with params
                    sub_layers = e.element.getSource().getParams().LAYERS.split(",");
                    for (var i = 0; i < sub_layers.length; i++) {
                        if (e.element.getSource().getUrls) //Multi tile
                            sub_layers[i] = e.element.getSource().getUrls()[0] + (e.element.getSource().getUrls()[0].indexOf('?') > 0 ? '' : '?') + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + sub_layers[i] + "&format=image%2Fpng";
                        if (e.element.getSource().getUrl) //Single tile
                            sub_layers[i] = e.element.getSource().getUrl() + (e.element.getSource().getUrl().indexOf('?') > 0 ? '' : '?') + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + sub_layers[i] + "&format=image%2Fpng";
                    }
                }
                e.element.on('change:visible', function(e) {
                    for (var i = 0; i < $scope.layers.length; i++) {
                        if ($scope.layers[i].layer == e.target) {
                            $scope.layers[i].visible = e.target.getVisible();
                            break;
                        }
                    }
                    if (!$scope.$$phase) $scope.$digest();
                })
                $scope.layers.push({
                    title: e.element.get("title"),
                    layer: e.element,
                    sub_layers: sub_layers,
                    visible: e.element.getVisible()
                });
                $rootScope.$broadcast('layermanager.updated', e.element);
            };

            /**
             * @function layerRemoved
             * @memberOf hs.layermanager.controller
             * @description Callback function for layer removing
             * @param {ol.CollectionEvent} e - Events emitted by ol.Collection instances are instances of this type.
             */
            var layerRemoved = function(e) {
                $(".layermanager-list").prepend($('.layerpanel'));
                $scope.currentlayer = null;
                for (var i = 0; i < $scope.layers.length; i++) {
                    if ($scope.layers[i].layer == e.element) {
                        $scope.layers.splice(i, 1);
                    }
                }
                $rootScope.$broadcast('layermanager.updated', e.element);
            };

            $scope.box_layers = box_layers;
            $scope.layers = [];
            $scope.active_box = null;

            /**
             * @function changeLayerVisibility
             * @memberOf hs.layermanager.controller
             * @description Callback function to set layers visibility
             * @param {object} $event - Info about the event and checkbox being clicked on
             * @param {object} layer - Wrapped ol.Layer
             */
            $scope.changeLayerVisibility = function($event, layer) {
                layer.layer.setVisible($event.target.checked);
            }

            /**
             * @function setCurrentLayer
             * @memberOf hs.layermanager.controller
             * @description Opens detailed view for manipulating layer and viewing metadata
             * @param {object} layer - Wrapped layer to edit or view
             * @param {number} index - Used to position the detail panel after layers li element
             */
            $scope.setCurrentLayer = function(layer, index) {
                $scope.currentlayer = layer;
                $(".layerpanel").insertAfter($("#layer-" + index));
                $scope.cur_layer_opacity = layer.layer.getOpacity();
                if (console) console.log(layer);
                return false;
            }

            /**
             * @function removeLayer
             * @memberOf hs.layermanager.controller
             * @description Removes layer from map
             * @param {object} layer
             */
            $scope.removeLayer = function(layer) {
                map.removeLayer(layer);
            }

            /**
             * @function zoomToLayer
             * @memberOf hs.layermanager.controller
             * @description Tries to read the BoundingBox property of layer or getExtent() of its source and zooms to it
             * @param {object} layer
             */
            $scope.zoomToLayer = function(layer) {
                var extent = null;
                if (layer.get("BoundingBox")) {
                    b = layer.get("BoundingBox")[0].extent;
                    var first_pair = [b[0], b[1]]
                    var second_pair = [b[2], b[3]];
                    first_pair = ol.proj.transform(first_pair, layer.get("BoundingBox")[0].crs, map.getView().getProjection());
                    second_pair = ol.proj.transform(second_pair, layer.get("BoundingBox")[0].crs, map.getView().getProjection());
                    var extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                } else {
                    extent = layer.getSource().getExtent();
                }
                if (extent != null)
                    map.getView().fitExtent(extent, map.getSize());
            }

            /**
             * @function layerIsZoomable
             * @memberOf hs.layermanager.controller
             * @description Determines if layer has BoundingBox defined as its metadata or is a Vector layer. Used for setting visibility of 'Zoom to ' button
             * @param {object} layer
             */
            $scope.layerIsZoomable = function(layer) {
                if (typeof layer == 'undefined') return false;
                if (layer.get("BoundingBox")) return true;
                if (layer.getSource().getExtent && layer.getSource().getExtent()) return true;
                return false;
            }

            /**
             * @function removeAllLayers
             * @memberOf hs.layermanager.controller
             * @description Removes all layers which don't have 'removable' attribute set to false
             */
            $scope.removeAllLayers = function(confirmed) {
                if (typeof confirmed == 'undefined') {
                    if ($("#hs-dialog-area #hs-remove-all-dialog").length == 0) {
                        var el = angular.element('<div hs.layermanager.remove_all_dialog_directive></span>');
                        $("#hs-dialog-area").append(el)
                        $compile(el)($scope);
                    } else {
                        $('#hs-remove-all-dialog').modal('show');
                    }
                    return;
                }
                var to_be_removed = [];
                OlMap.map.getLayers().forEach(function(lyr) {
                    if (typeof lyr.get('removable') == 'undefined' || lyr.get('removable') == true)
                        to_be_removed.push(lyr);
                });
                while (to_be_removed.length > 0) {
                    OlMap.map.removeLayer(to_be_removed.shift());
                }
            }

            /**
             * @function activateTheme
             * @memberOf hs.layermanager.controller
             * @description Show a particular groups layers, hide allthe rest
             * @param {ol.layer.Group} theme - Group layer to activate
             */
            $scope.activateTheme = function(theme) {
                if ($scope.active_box) $scope.active_box.set('active', false);
                $scope.active_box = theme;
                theme.set('active', true);
                angular.forEach(box_layers, function(box) {
                    box.setVisible(box == theme);
                    angular.forEach(box.get('layers'), function(lyr) {
                        if (lyr.get('base') == true) return;
                        lyr.setVisible(box.getVisible());
                    });
                });
            }

            OlMap.map.getLayers().forEach(function(lyr) {
                layerAdded({
                    element: lyr
                });
            });
            map.getLayers().on("add", layerAdded);
            map.getLayers().on("remove", layerRemoved);
            $scope.$emit('scope_loaded', "LayerManager");
        }
    ]);
})
