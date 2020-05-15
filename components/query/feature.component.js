import { Vector as VectorSource } from 'ol/source';
import 'utils.module';

export default {
    template: require('./partials/feature.html'),
    bindings: {
        feature: '<'
    },
    controller: ['$scope', 'HsUtilsService', 'HsUtilsLayerUtilsService', 'HsMapService', 'HsQueryVectorService',
        function ($scope, utils, layerUtilsService, hsMap, queryVectorService) {
            let olSource = () => {
                let layer = olFeature().getLayer(hsMap.map);
                if(angular.isUndefined(layer)) 
                    return;
                else
                    return layer.getSource()
            }
            let olFeature = () => {
                return $scope.$ctrl.feature.feature;
            }
            angular.extend($scope, {
                queryVectorService,
                attributeName: '',
                attributeValue: '',
                newAttribVisible: false,
                exportFormats: [
                    { name: 'WKT format' }
                ],
                isFeatureRemovable() {
                    if (angular.isDefined($scope.$ctrl.feature.feature)){
                        let source = olSource();
                        if(angular.isUndefined(source)) return false;
                        let layer = olFeature().getLayer(hsMap.map);
                        return utils.instOf(source, VectorSource)
                            && layerUtilsService.isLayerEditable(layer);
                    }
                    else return false;
                },
                exportData: queryVectorService.exportData,
                saveNewAttribute(attributeName, attributeValue) {
                    if ($scope.$ctrl.feature && $scope.$ctrl.feature.feature) {
                        const feature = $scope.$ctrl.feature.feature;
                        var getDuplicates = $scope.$ctrl.feature.attributes.filter(duplicate => duplicate.name == attributeName);
                        if (getDuplicates.length == 0) {
                            var obj = { name: attributeName, value: attributeValue };
                            $scope.$ctrl.feature.attributes.push(obj);
                            feature.set(attributeName, attributeValue);
                        }
                    }
                    $scope.$ctrl.newAttribVisible = !$scope.$ctrl.newAttribVisible;
                    $scope.$ctrl.attributeName = '';
                    $scope.$ctrl.attributeValue = '';
                },
                removeFeature() {
                    let source = olSource();
                    if (utils.instOf(source, VectorSource))
                        source.removeFeature(olFeature());
                    $scope.$emit('infopanel.featureRemoved', $scope.$ctrl.feature);
                },
                zoomToFeature() {
                    let extent = olFeature().getGeometry().getExtent();
                    hsMap.map.getView().fit(extent, hsMap.map.getSize());
                }
            });
        }],
    transclude: false
};
