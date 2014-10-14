angular.module('hs.layermanager', ['hs.map'])
    .directive('layerManager', function() {
        return {
            templateUrl: 'components/layermanager/partials/layermanager.html'
        };
    })

.controller('LayerManager', ['$scope', 'OlMap',
    function($scope, OlMap) {
        $scope.map = OlMap.map;
        $scope.layers = [];
        $scope.layerAdded = function(e) {
            $scope.layers.push({
                "title": e.element.get("title"),
                "layer": e.element
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
        for(var lyr in OlMap.map.getLayers().array_){
            $scope.layerAdded({element:OlMap.map.getLayers().array_[lyr]});
        }
        $scope.changeLayerVisibility = function($event, layer){
                layer.layer.setVisible($event.target.checked);
        }
        $scope.map.getLayers().on("add", $scope.layerAdded);
        $scope.map.getLayers().on("remove", $scope.layerRemoved);
    }
]);