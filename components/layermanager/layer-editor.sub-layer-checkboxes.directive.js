
    export default ['hs.layerEditor.sublayerService','hs.layermanager.service',
    function(subLayerService, LayMan){
        return {
                template: require('./partials/sub-layer-checkboxes.html'),
    
            controller: ['$scope', function ($scope) {
                
                $scope.checkedSubLayers = subLayerService.checkedSubLayers;
                $scope.withChildren = subLayerService.withChildren;
                $scope.expanded = false;

                $scope.getSubLayers = function (){
                   return subLayerService.getSubLayers();
                }

                $scope.subLayerIsString= function(subLayer){
                    return typeof subLayer == 'string'
                };

                $scope.toggleExpanded = function(){
                        $scope.expanded = !$scope.expanded
                };
                $scope.subLayerSelected = function (sublayer,state){
                    if (angular.isDefined(sublayer) && sublayer.Layer){
                        angular.forEach(sublayer.Layer,function(children){
                            angular.extend($scope.checkedSubLayers, {[children.Name]:state});
                        })
                    }
                    return subLayerService.subLayerSelected();
                };

            }]
        };
    }]
