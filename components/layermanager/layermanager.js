define(['angular', 'app', 'map'], function(angular) {
    angular.module('hs.layermanager', ['hs.map'])
        .directive('layerManager', function() {
            return {
                templateUrl: hsl_path + 'components/layermanager/partials/layermanager.html'
            };
        })

    .controller('LayerManager', ['$scope', 'OlMap', 'box_layers',
        function($scope, OlMap, box_layers) {
            $scope.map = OlMap.map;
            $scope.box_layers = box_layers;
            $scope.layers = [];
            $scope.active_box = null;
            $scope.layerAdded = function(e) {
                var sub_layers;
                if (e.element.getSource().getParams) { // Legend only for wms layers with params
                    sub_layers = e.element.getSource().getParams().LAYERS.split(",");
                    for (var i = 0; i < sub_layers.length; i++) {
                        sub_layers[i] = e.element.getSource().getUrls()[0] + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + sub_layers[i] + "&format=image/png";
                    }
                }
                e.element.on('change:visible', function(e) {
                    for (var i = 0; i < $scope.layers.length; i++) {
                        if ($scope.layers[i].layer == e.target) {
                            $scope.layers[i].visible = e.target.getVisible();
                            break;
                        }
                    }
                    if (!$scope.$$phase) $scope.$apply();
                })
                $scope.layers.push({
                    title: e.element.get("title"),
                    layer: e.element,
                    sub_layers: sub_layers,
                    visible: e.element.getVisible()
                });
            };
            $scope.layerRemoved = function(e) {
                for (var i = 0; i < $scope.layers.length; i++) {
                    if ($scope.layers[i].layer == e.element) {
                        $scope.layers.splice(i);
                        break;
                    }
                }
            };
            for (var lyr in OlMap.map.getLayers().array_) {
                $scope.layerAdded({
                    element: OlMap.map.getLayers().array_[lyr]
                });
            }
            $scope.changeLayerVisibility = function($event, layer) {
                layer.layer.setVisible($event.target.checked);
            }
            $scope.setCurrentLayer = function(layer) {
                $scope.currentlayer = layer;
                if (console) console.log(layer);
            }
            $scope.removeLayer = function(layer) {
                $scope.map.removeLayer(layer);
            }
            $scope.zoomToLayer = function(layer) {
                var extent = ol.proj.transform(layer.get("BoundingBox")[0].extent, layer.get("BoundingBox")[0].crs, $scope.map.getView().getProjection());
                $scope.map.getView().fitExtent(extent, $scope.map.getSize());
            }
            $scope.map.getLayers().on("add", $scope.layerAdded);
            $scope.map.getLayers().on("remove", $scope.layerRemoved);
            $scope.boxClicked = function(box) {
                if ($scope.active_box) $scope.active_box.active = false;
                $scope.active_box = box;
                box.active = true;
                for (var i = 0; i < $scope.layers.length; i++) {
                    var lyr = $scope.layers[i].layer;
                    if (lyr.get('box_id') && lyr.get('box_id') == box.id) {
                        if (lyr.get('base')) {
                            lyr.setVisible(true);
                        }
                        lyr.setVisible(true);
                    } else {
                        lyr.setVisible(false);
                    }
                }
            }
        }
    ]);
})
