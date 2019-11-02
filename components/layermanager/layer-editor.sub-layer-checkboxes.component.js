export default  {
        template: require('./partials/sub-layer-checkboxes.html'),
        bindings: {
            subLayer: '<',
            checkedSubLayers: '<',
            withChildren: '='
        },
        controller: ['$scope', '$element', function($scope, $element){
            angular.extend($scope, {
                checkedSubLayers: {},
                expanded: false,
                isVisible(){
                    return false
                },
                subLayerIsString(subLayer){
                    return typeof subLayer == 'string'
                },
                subLayerSelected(sublayer,state){
                    if (angular.isDefined(sublayer) && sublayer.children){
                        angular.forEach(sublayer.children,function(children){
                            angular.extend($scope.checkedSubLayers, {[children.name]:state});
                        })
                    }
                    var event = new CustomEvent('checked', {detail: $scope.checkedSubLayers});
                    $element[0].dispatchEvent(event);
                },
                toggleExpanded(){
                    $scope.expanded = !$scope.expanded
                },
                nestedLayerChecked(e){
                    angular.extend($scope.checkedSubLayers, e.detail);
                    $scope.subLayerSelected();
                },
                populateNestedLayers(sublayer){
                    angular.extend($scope.checkedSubLayers, {[sublayer.name]:true});

                }
            })
        }]
    };
