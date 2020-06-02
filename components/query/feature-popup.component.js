import Overlay from 'ol/Overlay';
export default {
  template: require('./partials/feature-popup.html'),
  controller: function (
    $scope,
    HsQueryBaseService,
    HsMapService,
    HsQueryVectorService,
    $element
  ) {
    'ngInject';
    angular.extend($scope, {
      queryBaseService: HsQueryBaseService,
      vectorService: HsQueryVectorService,
      popupVisible() {
        return {
          'visibility':
            HsQueryBaseService.featuresUnderMouse.length > 0
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
      isFeatureRemovable(feature) {
        return HsQueryVectorService.isFeatureRemovable(feature);
      },
      isLayerEditable(layer) {
        return HsQueryVectorService.isLayerEditable(layer);
      },
      removeFeature(feature) {
        HsQueryVectorService.removeFeature(feature);
      },
      clearLayer(layer) {
        layer.getSource().clear();
      },
    });
    const hoverPopupElement = $element[0];
    HsQueryBaseService.hoverPopup = new Overlay({
      element: hoverPopupElement,
    });

    $scope.$on('map.loaded', (e) => {
      HsMapService.map.addOverlay(HsQueryBaseService.hoverPopup);
    });
  },
};
