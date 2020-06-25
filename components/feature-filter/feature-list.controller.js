import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';

/**
 * @param $scope
 * @param HsMapService
 * @param HsCore
 * @param HsFeatureFilterService
 * @param HsLayermanagerService
 * @param HsConfig
 */
export default function (
  $scope,
  HsMapService,
  HsCore,
  HsFeatureFilterService,
  HsLayermanagerService,
  HsConfig
) {
  'ngInject';
  $scope.map = HsMapService.map;
  $scope.LayMan = HsLayermanagerService;

  $scope.applyFilters = HsFeatureFilterService.applyFilters;

  $scope.displayDetails = false;

  $scope.toggleFeatureDetails = function (feature) {
    $scope.displayDetails = !$scope.displayDetails;
    if ($scope.selectedFeature) {
      $scope.selectedFeature.setStyle(null);
    }

    if ($scope.displayDetails) {
      $scope.featureDetails = feature.values_;
      $scope.selectedFeature = feature;
      HsMapService.moveToAndZoom(
        feature.values_.geometry.flatCoordinates[0],
        feature.values_.geometry.flatCoordinates[1],
        7
      );
      feature.setStyle(
        new Style({
          image: new Icon({
            crossOrigin: 'anonymous',
            src: 'marker_lt.png',
            anchor: [0.5, 1],
            scale: 0.4,
          }),
        })
      );
    }
  };

  $scope.$emit('scope_loaded', 'featureList');
}
