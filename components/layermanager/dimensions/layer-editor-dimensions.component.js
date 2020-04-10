import {ImageWMS, TileWMS, XYZ} from 'ol/source';
export default {
  template: require('./layer-editor-dimensions.html'),
  bindings: {
    olLayer: '<',
  },
  controller: [
    '$scope',
    'hs.dimensionService',
    'hs.utils.service',
    function ($scope, dimensionService, utils) {
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
          if (utils.instOf(src, TileWMS) || utils.instOf(src, ImageWMS)) {
            const params = src.getParams();
            params[dimension.name] = dimension.value;
            src.updateParams(params);
          } else if (utils.instOf(src, XYZ)) {
            src.refresh();
          }
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
