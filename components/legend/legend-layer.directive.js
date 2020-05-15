import VectorLayer from 'ol/layer/Vector';
export default [
  'HsConfig',
  function (config) {
    return {
      template: require('./partials/layer-directive.html'),
      scope: {
        layer: '<',
      },
      controller: [
        '$scope',
        'HsLegendService',
        'HsUtilsService',
        function ($scope, service, utils) {
          const olLayer = $scope.layer.lyr;
          $scope.styles = [];
          $scope.geometryTypes = [];
          if (utils.instOf(olLayer, VectorLayer)) {
            $scope.styles = service.getStyleVectorLayer(olLayer);
            $scope.geometryTypes = service.getVectorFeatureGeometry(olLayer);
          }
          if (olLayer.getSource()) {
            const source = olLayer.getSource();
            const changeHandler = utils.debounce(
              (e) => {
                $scope.styles = service.getStyleVectorLayer(olLayer);
                $scope.geometryTypes = service.getVectorFeatureGeometry(
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
      ],
    };
  },
];
