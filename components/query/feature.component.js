import '../utils/utils.module';
import {Vector as VectorSource} from 'ol/source';

export default {
  template: require('./partials/feature.html'),
  bindings: {
    feature: '<',
  },
  controller: function (
    $scope,
    HsUtilsService,
    HsLayerUtilsService,
    HsMapService,
    HsQueryVectorService
  ) {
    'ngInject';
    const olSource = () => {
      const layer = olFeature().getLayer(HsMapService.map);
      if (angular.isUndefined(layer)) {
        return;
      } else {
        return layer.getSource();
      }
    };
    const olFeature = () => {
      return $scope.$ctrl.feature.feature;
    };
    angular.extend($scope, {
      queryVectorService: HsQueryVectorService,
      attributeName: '',
      attributeValue: '',
      newAttribVisible: false,
      exportFormats: [{name: 'WKT format'}],
      isFeatureRemovable() {
        if (angular.isDefined($scope.$ctrl.feature.feature)) {
          const source = olSource();
          if (angular.isUndefined(source)) {
            return false;
          }
          const layer = olFeature().getLayer(HsMapService.map);
          return (
            HsUtilsService.instOf(source, VectorSource) &&
            HsLayerUtilsService.isLayerEditable(layer)
          );
        } else {
          return false;
        }
      },
      exportData: HsQueryVectorService.exportData,
      saveNewAttribute(attributeName, attributeValue) {
        if ($scope.$ctrl.feature && $scope.$ctrl.feature.feature) {
          const feature = $scope.$ctrl.feature.feature;
          const getDuplicates = $scope.$ctrl.feature.attributes.filter(
            (duplicate) => duplicate.name == attributeName
          );
          if (getDuplicates.length == 0) {
            const obj = {name: attributeName, value: attributeValue};
            $scope.$ctrl.feature.attributes.push(obj);
            feature.set(attributeName, attributeValue);
          }
        }
        $scope.$ctrl.newAttribVisible = !$scope.$ctrl.newAttribVisible;
        $scope.$ctrl.attributeName = '';
        $scope.$ctrl.attributeValue = '';
      },
      removeFeature() {
        const source = olSource();
        if (HsUtilsService.instOf(source, VectorSource)) {
          source.removeFeature(olFeature());
        }
        $scope.$emit('infopanel.featureRemoved', $scope.$ctrl.feature);
      },
      zoomToFeature() {
        const extent = olFeature().getGeometry().getExtent();
        HsMapService.map.getView().fit(extent, HsMapService.map.getSize());
      },
    });
  },
  transclude: false,
};
