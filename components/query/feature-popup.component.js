import Overlay from 'ol/Overlay';
export default {
  template: require('./partials/feature-popup.html'),
  controller: [
    '$scope',
    'HsQueryBaseService',
    'HsMapService',
    'HsQueryVectorService',
    '$element',
    '$timeout',
    function (
      $scope,
      queryBaseService,
      hsMap,
      vectorService,
      $element,
      $timeout
    ) {
      angular.extend($scope, {
        queryBaseService,
        vectorService,
        popupVisible() {
          return {
            'visibility':
              queryBaseService.featuresUnderMouse.length > 0
                ? 'visible'
                : 'hidden',
          };
        },
        isClustered(feature) {
          return feature.get('features') && feature.get('features').length > 0;
        },
        serializeFeatureName(feature) {
          if (feature.get('name')) {
            return feature.get('name');
          }
          if (feature.get('title')) {
            return feature.get('title');
          }
          if (feature.get('label')) {
            return feature.get('label');
          }
        },
      });
      const hoverPopupElement = $element[0];
      queryBaseService.hoverPopup = new Overlay({
        element: hoverPopupElement,
      });

      $scope.$on('map.loaded', (e) => {
        hsMap.map.addOverlay(queryBaseService.hoverPopup);
      });
    },
  ],
};
