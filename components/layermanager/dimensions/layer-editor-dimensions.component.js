export default {
  template: require('./layer-editor-dimensions.html'),
  bindings: {
    olLayer: '<',
  },
  controller: [
    '$scope',
    'hs.dimensionService',
    function ($scope, dimensionService) {
      const vm = this;
      angular.extend(vm, {
        dimensionType: dimensionService.dimensionType,

        /**
         * @function isLayerWithDimensions
         * @memberOf hs.layer-editor-dimensions
         * @description Test if layer has dimensions
         * @returns {Boolean} Returns if layers has any dimensions
         */
        isLayerWithDimensions() {
          const layer = vm.olLayer;
          if (angular.isUndefined(layer)) {
            return false;
          }
          if (angular.isUndefined(layer.get('dimensions'))) {
            return false;
          }
          return Object.keys(layer.get('dimensions')).length > 0;
        },

        dimensionChanged(dimension) {
          const src = vm.olLayer.getSource();
          const params = src.getParams();
          params[dimension.name] = dimension.value;
          src.updateParams(params);
          $scope.$emit('layermanager.dimension_changed', {
            layer: vm.olLayer,
            dimension,
          });
        },

        dimensions() {
          const layer = vm.olLayer;
          if (angular.isUndefined(layer)) {
            return [];
          }
          return layer.get('dimensions');
        },
      });
    },
  ],
};
