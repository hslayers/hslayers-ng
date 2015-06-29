define(['angular', 'app', 'map', 'ol'], function(angular, app, map, ol) {
    angular.module('hs.layermanager', ['hs.map'])
        .directive('layerManager', function() {
            return {
                templateUrl: hsl_path + 'components/layermanager/partials/layermanager.html'
            };
        })

    .controller('LayerManager', ['$scope', 'OlMap', 'box_layers', '$rootScope', 'Core',
        function($scope, OlMap, box_layers, $rootScope, Core) {
            $scope.Core = Core;
            var map = OlMap.map;
            var cur_layer_opacity = 1;

            var layerAdded = function(e) {
                if (e.element.get('show_in_manager') != null && e.element.get('show_in_manager') == false) return;
                var sub_layers;
                if (e.element.getSource().getParams) { // Legend only for wms layers with params
                    sub_layers = e.element.getSource().getParams().LAYERS.split(",");
                    for (var i = 0; i < sub_layers.length; i++) {
                        if (e.element.getSource().getUrls) //Multi tile
                            sub_layers[i] = e.element.getSource().getUrls()[0] + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + sub_layers[i] + "&format=image/png";
                        if (e.element.getSource().getUrl) //Single tile
                            sub_layers[i] = e.element.getSource().getUrl() + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + sub_layers[i] + "&format=image/png";
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
                $rootScope.$broadcast('layermanager.updated');
            };

            var layerRemoved = function(e) {
                $(".layermanager-list").prepend($('.layerpanel'));
                $scope.currentlayer = null;
                for (var i = 0; i < $scope.layers.length; i++) {
                    if ($scope.layers[i].layer == e.element) {
                        $scope.layers.splice(i, 1);
                    }
                }
                $rootScope.$broadcast('layermanager.updated');
            };

            $scope.box_layers = box_layers;
            $scope.layers = [];
            $scope.active_box = null;

            $scope.changeLayerVisibility = function($event, layer) {
                layer.layer.setVisible($event.target.checked);
            }

            $scope.setCurrentLayer = function(layer, index) {
                $scope.currentlayer = layer;
                $(".layerpanel").insertAfter($("#layer-" + index));
                $scope.cur_layer_opacity = layer.layer.getOpacity();
                if (console) console.log(layer);
                return false;
            }

            $scope.removeLayer = function(layer) {
                map.removeLayer(layer);
            }

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

            $scope.layerIsZoomable = function(layer) {
                if (typeof layer == 'undefined') return false;
                if (layer.get("BoundingBox")) return true;
                if (layer.getSource().getExtent && layer.getSource().getExtent()) return true;
                return false;
            }

            $scope.activateTheme = function(theme) {
                if ($scope.active_box) $scope.active_box.active = false;
                $scope.active_box = theme;
                theme.active = true;
                for (var i = 0; i < $scope.layers.length; i++) {
                    var lyr = $scope.layers[i].layer;
                    if (lyr.get('box_id') && (lyr.get('box_id') == theme.id || lyr.get('box_id') == 'base')) {
                        /* if (lyr.get('base')) {
                             lyr.setVisible(true);
                         }*/
                        lyr.setVisible(true);
                    } else {
                        lyr.setVisible(false);
                    }
                }
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
