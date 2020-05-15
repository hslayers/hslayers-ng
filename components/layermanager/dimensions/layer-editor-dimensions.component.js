import {ImageWMS, TileWMS, XYZ} from 'ol/source';
export default {
  template: require('./layer-editor-dimensions.html'),
  bindings: {
    olLayer: '<',
  },
  controller: [
    '$scope',
    'HsDimensionService',
    'HsUtilsService',
    'HsMapService',
    function ($scope, dimensionService, utils, hsMap) {
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
          //Dimension can be linked to multiple layers
          hsMap.map.getLayers().forEach((layer) => {
            const iteratedDimensions = layer.get('dimensions');
            if (
              iteratedDimensions &&
              Object.keys(iteratedDimensions).filter(
                (dimensionIterator) =>
                  iteratedDimensions[dimensionIterator] == dimension
              ).length > 0 //Dimension also linked to this layer?
            ) {
              const src = layer.getSource();
              if (utils.instOf(src, TileWMS) || utils.instOf(src, ImageWMS)) {
                const params = src.getParams();
                params[dimension.name] = dimension.value;
                src.updateParams(params);
              } else if (utils.instOf(src, XYZ)) {
                src.refresh();
              }
              $scope.$emit('layermanager.dimension_changed', {
                layer: layer,
                dimension,
              });
            }
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
