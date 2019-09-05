import { Vector as VectorSource } from 'ol/source';
import 'utils.module';

export default {
    template: require('./partials/feature.html'),
    bindings: {
        feature: '='
    },
    controller: ['$scope', 'hs.utils.service', 'hs.utils.layerUtilsService', 'hs.map.service',
        function ($scope, utils, layerUtilsService, hsMap) {
            let olSource = () => {
                return olFeature().getLayer(hsMap.map).getSource()
            }
            let olFeature = () => {
                return $scope.$ctrl.feature.feature
            }
            angular.extend($scope, {
                isFeatureRemovable() {
                    let source = olSource();
                    let layer = olFeature().getLayer(hsMap.map);
                    return utils.instOf(source, VectorSource)
                        && layerUtilsService.isLayerEditable(layer);
                },
                removeFeature() {
                    let source = olSource();
                    if (utils.instOf(source, VectorSource))
                        source.removeFeature(olFeature());
                    $scope.$emit('infopanel.featureRemoved', $scope.$ctrl.feature);
                },
                zoomToFeature(){
                    let extent = olFeature().getGeometry().getExtent();
                    hsMap.map.getView().fit(extent, hsMap.map.getSize());
                }
            });
        }],
    transclude: false
};
