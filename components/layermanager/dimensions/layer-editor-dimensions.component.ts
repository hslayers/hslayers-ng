import {ImageWMS, TileWMS, XYZ} from 'ol/source';
export default {
  template: require('./layer-editor-dimensions.html'),
  bindings: {
    olLayer: '<',
  },
  controller: function (
    $scope,
    HsDimensionService,
    HsUtilsService,
    HsMapService
  ) {
    'ngInject';
    const vm = this;
    angular.extend(vm, {
      dimensionType: HsDimensionService.dimensionType,

      /**
       * @function isLayerWithDimensions
       * @memberOf hs.layer-editor-dimensions
       * @description Test if layer has dimensions
       * @returns {boolean} Returns if layers has any dimensions
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
        HsMapService.map.getLayers().forEach((layer) => {
          const iteratedDimensions = layer.get('dimensions');
          if (
            iteratedDimensions &&
            Object.keys(iteratedDimensions).filter(
              (dimensionIterator) =>
                iteratedDimensions[dimensionIterator] == dimension
            ).length > 0 //Dimension also linked to this layer?
          ) {
            const src = layer.getSource();
            if (
              HsUtilsService.instOf(src, TileWMS) ||
              HsUtilsService.instOf(src, ImageWMS)
            ) {
              const params = src.getParams();
              params[dimension.name] = dimension.value;
              src.updateParams(params);
            } else if (HsUtilsService.instOf(src, XYZ)) {
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
};
