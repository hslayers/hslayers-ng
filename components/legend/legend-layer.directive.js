import VectorLayer from 'ol/layer/Vector';
/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require('./partials/layer-directive.html'),
    scope: {
      layer: '<',
    },
    controller: function ($scope, HsLegendService, HsUtilsService) {
      'ngInject';
      const olLayer = $scope.layer.lyr;
      $scope.styles = [];
      $scope.geometryTypes = [];
      if (HsUtilsService.instOf(olLayer, VectorLayer)) {
        $scope.styles = HsLegendService.getStyleVectorLayer(olLayer);
        $scope.geometryTypes = HsLegendService.getVectorFeatureGeometry(
          olLayer
        );
      }
      if (olLayer.getSource()) {
        const source = olLayer.getSource();
        const changeHandler = HsUtilsService.debounce(
          (e) => {
            $scope.styles = HsLegendService.getStyleVectorLayer(olLayer);
            $scope.geometryTypes = HsLegendService.getVectorFeatureGeometry(
              olLayer
            );
          },
          200,
          false,
          this
        );
        source.on('changefeature', changeHandler);
        source.on('addfeature', changeHandler);
        source.on('removefeature', changeHandler);
      }
    },
  };
}
