import Overlay from 'ol/Overlay';
export default {
  template: require('./partials/feature-popup.html'),
  controller: function (
    $scope,
    HsQueryBaseService,
    HsMapService,
    HsQueryVectorService,
    $element,
    HsConfirmDialogService,
    gettext
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

      async removeFeature(feature) {
        const confirmed = await HsConfirmDialogService.show(
          gettext('Really delete all the feature?'),
          gettext('Confirm delete')
        );
        if (confirmed == 'yes') {
          HsQueryVectorService.removeFeature(feature);
          HsQueryBaseService.featuresUnderMouse = [];
        }
      },

      async clearLayer(layer) {
        const confirmed = await HsConfirmDialogService.show(
          gettext('Really delete all the features in layer?'),
          gettext('Confirm delete')
        );
        if (confirmed == 'yes') {
          layer.getSource().clear();
          HsQueryBaseService.featuresUnderMouse = [];
        }
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
