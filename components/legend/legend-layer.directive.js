export default ['config', function (config) {
    return {
        template: require('components/legend/partials/layer-directive.html'),
        scope: {
            layer: '<'
        },
        controller: ['$scope', 'hs.legend.service', 'hs.utils.service', function($scope, service, utils){
            $scope.styles = service.getStyleVectorLayer($scope.layer.lyr);
            $scope.geometryTypes = service.getVectorFeatureGeometry($scope.layer.lyr);
            if($scope.layer.lyr.getSource()){
                let source = $scope.layer.lyr.getSource();
                var changeHandler = utils.debounce(function (e) {
                    $scope.styles = service.getStyleVectorLayer($scope.layer.lyr);
                    $scope.geometryTypes = service.getVectorFeatureGeometry($scope.layer.lyr);
                }, 200);
                source.on('changefeature', changeHandler);
                source.on('addfeature', changeHandler);
                source.on('removefeature', changeHandler);
            }
        }]
    };
}]