export default {
  template: require('./partials/feature.html'),
  bindings: {
    feature: '<',
  },
  controller: function ($scope, HsMapService, HsQueryVectorService) {
    'ngInject';
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
          return HsQueryVectorService.isFeatureRemovable(olFeature());
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
        HsQueryVectorService.removeFeature(olFeature());
        $scope.$emit('infopanel.featureRemoved', olFeature());
      },
      zoomToFeature() {
        const extent = olFeature().getGeometry().getExtent();
        HsMapService.map.getView().fit(extent, HsMapService.map.getSize());
      },
    });
  },
  transclude: false,
};
