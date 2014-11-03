define(['angular', 'map'], function(angular) {
    angular.module('hs.layermanager', ['hs.map'])
        .directive('layerManager', function() {
            return {
                templateUrl: hsl_path + 'components/layermanager/partials/layermanager.html'
            };
        })

    .controller('LayerManager', ['$scope', 'OlMap',
        function($scope, OlMap) {
            $scope.map = OlMap.map;
            $scope.layers = [];
            $scope.layerAdded = function(e) {
                var sub_layers;
                if (e.element.getSource().getParams) { // Legend only for wms layers with params
                    sub_layers = e.element.getSource().getParams().LAYERS.split(",");
                    for (var i = 0; i < sub_layers.length; i++) {
                        sub_layers[i] = e.element.getSource().getUrls()[0] + "&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + sub_layers[i] + "&format=image/png";
                    }
                }
                $scope.layers.push({
                    title: e.element.get("title"),
                    layer: e.element,
                    sub_layers: sub_layers
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
        }
    ]);
})
