export default {
  template: (HsConfig) => {
    'ngInject';
    if (HsConfig.design == 'md') {
      return require('./partials/legendmd.html');
    } else {
      return require('./partials/legend.html');
    }
  },
  controller: function ($scope, HsMapService, HsLegendService) {
    'ngInject';
    let map;

    angular.extend($scope, {
      layerDescriptors: [],

      /**
       * Add selected layer to the list of layers in legend (with event listener
       * to display/hide legend item when layer visibility change)
       *
       * @memberof hs.legend.controller
       * @function addLayerToLegends
       * @param {object} layer Layer to add legend for
       */
      addLayerToLegends: function (layer) {
        const descriptor = HsLegendService.getLayerLegendDescriptor(layer);
        if (descriptor) {
          $scope.layerDescriptors.push(descriptor);
          layer.on('change:visible', layerVisibilityChanged);
          layer.getSource().on('change', layerSourcePropChanged);
        }
      },

      /**
       * Check if there is any visible layer
       *
       * @memberof hs.legend.controller
       * @returns {boolean} Returns true if no layers with legend exist
       * @function noLayerExists
       */
      noLayerExists: function () {
        const visibleLayers = $scope.layerDescriptors.filter(
          (check) => check.visible
        );
        return visibleLayers.length == 0;
      },

      /**
       * Remove selected layer from legend items
       *
       * @memberof hs.legend.controller
       * @function removeLayerFromLegends
       * @param {Ol.layer} layer Layer to remove from legend
       */
      removeLayerFromLegends: function (layer) {
        for (let i = 0; i < $scope.layerDescriptors.length; i++) {
          if ($scope.layerDescriptors[i].lyr == layer) {
            $scope.layerDescriptors.splice(i, 1);
            break;
          }
        }
      },

      /**
       * Refresh event listeners UNUSED
       *
       * @memberof hs.legend.controller
       * @function refresh
       */
      refresh: function () {},

      isLegendable: HsLegendService.isLegendable,
    });

    /**
     *
     */
    function init() {
      map = HsMapService.map;
      map.getLayers().on('add', layerAdded);
      map.getLayers().on('remove', (e) => {
        $scope.removeLayerFromLegends(e.element);
      });
      map.getLayers().forEach((lyr) => {
        layerAdded({
          element: lyr,
        });
      });
    }

    /**
     * (PRIVATE) Callback function for adding layer to map, add layers legend
     *
     * @memberof hs.legend.controller
     * @function layerAdded
     * @param {object} e Event object, should have element property
     */
    function layerAdded(e) {
      $scope.addLayerToLegends(e.element);
    }

    /**
     * @param e event description
     */
    function layerVisibilityChanged(e) {
      const descriptor = findLayerDescriptor(e.target);
      if (descriptor) {
        descriptor.visible = e.target.getVisible();
      }
    }

    /**
     * @param e event description
     */
    function layerSourcePropChanged(e) {
      const descriptor = findLayerDescriptorBySource(e.target);
      if (descriptor) {
        const newDescriptor = HsLegendService.getLayerLegendDescriptor(
          descriptor.lyr
        );

        if (
          newDescriptor.subLayerLegends != descriptor.subLayerLegends ||
          newDescriptor.title != descriptor.title
        ) {
          $scope.layerDescriptors[
            $scope.layerDescriptors.indexOf(descriptor)
          ] = newDescriptor;
        }
      }
    }

    /**
     * Finds layer descriptor for openlayers layer
     *
     * @returns {object} Object describing the legend
     * @param {ol/layer} layer OpenLayers layer
     */
    function findLayerDescriptor(layer) {
      const found = $scope.layerDescriptors.filter((ld) => ld.lyr == layer);
      if (found.length > 0) {
        return found[0];
      }
    }

    /**
     * @param source
     */
    function findLayerDescriptorBySource(source) {
      const found = $scope.layerDescriptors.filter(
        (ld) => ld.lyr.getSource() == source
      );
      if (found.length > 0) {
        return found[0];
      }
    }

    HsMapService.loaded().then(init);

    $scope.$emit('scope_loaded', 'Legend');
  },
};
