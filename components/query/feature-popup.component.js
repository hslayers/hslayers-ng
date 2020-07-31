import Overlay from 'ol/Overlay';
export default {
  template: require('./partials/feature-popup.html'),
  controller: function (
    $scope,
    HsQueryBaseService,
    HsMapService,
    HsQueryVectorService,
    $element,
    gettext,
    $injector,
    HsEventBusService
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
        const dialog = $injector.get('HsConfirmDialog');
        const confirmed = await dialog.show(
          gettext('Really delete this feature?'),
          gettext('Confirm delete')
        );
        if (confirmed == 'yes') {
          HsQueryVectorService.removeFeature(feature);
          HsQueryBaseService.featuresUnderMouse = [];
        }
      },

      async clearLayer(layer) {
        const dialog = $injector.get('HsConfirmDialog');
        const confirmed = await dialog.show(
          gettext('Really delete all features from layer "{0}"?').replace(
            '{0}',
            layer.get('title')
          ),
          gettext('Confirm delete')
        );
        if (confirmed == 'yes') {
          if (layer.getSource().getSource) {
            //Clear clustered?
            layer.getSource().getSource().clear();
          }
          layer.getSource().clear();
          HsQueryBaseService.featuresUnderMouse = [];
        }
      },
    });

    const hoverPopupElement = $element[0];
    HsQueryBaseService.hoverPopup = new Overlay({
      element: hoverPopupElement,
    });

    HsEventBusService.olMapLoads.subscribe((map) => {
      map.addOverlay(HsQueryBaseService.hoverPopup);
    });
  },
};
