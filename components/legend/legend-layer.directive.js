import VectorLayer from 'ol/layer/Vector';
export default ['config', function (config) {
    return {
        template: require('components/legend/partials/layer-directive.html'),
        scope: {
            layer: '<'
        },
        controller: ['$scope', 'hs.legend.service', 'hs.utils.service', function ($scope, service, utils) {
            var olLayer = $scope.layer.lyr;
            $scope.styles = [];
            $scope.geometryTypes = [];
            if(utils.instOf(olLayer, VectorLayer)){
                $scope.styles = service.getStyleVectorLayer(olLayer);
                $scope.geometryTypes = service.getVectorFeatureGeometry(olLayer);
            }            
            if (olLayer.getSource()) {
                let source = olLayer.getSource();
                var changeHandler = utils.debounce(function (e) {
                    $scope.styles = service.getStyleVectorLayer(olLayer);
                    $scope.geometryTypes = service.getVectorFeatureGeometry(olLayer);
                }, 200);
                source.on('changefeature', changeHandler);
                source.on('addfeature', changeHandler);
                source.on('removefeature', changeHandler);
            }
        }]
    };
}]