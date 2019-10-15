export default  {
        template: require('./partials/sub-layer-checkboxes.html'),
        bindings: {
            subLayer: '<'
        },
        controller: ['$scope', '$element', function($scope, $element){
            angular.extend($scope, {
                checkedSubLayers: {},
                expanded: false,
                subLayerIsString(subLayer){
                    return typeof subLayer == 'string'
                },
                subLayerSelected(){
                    var event = new CustomEvent('checked', {detail: $scope.checkedSubLayers});
                    $element[0].dispatchEvent(event);
                },
                toggleExpanded(){
                    $scope.expanded = !$scope.expanded
                },
                nestedLayerChecked(e){
                    angular.extend($scope.checkedSubLayers, e.detail);
                    $scope.subLayerSelected();
                }
            })
        }]
    };
