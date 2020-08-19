export default {
  template: (HsConfig) => {
    'ngInject';
    if (HsConfig.design == 'md') {
      return require('./partials/layermanagermd.html');
    } else {
      return require('./partials/layermanager.html');
    }
  },
  controller: function (
    $scope,
    HsCore,
    $compile,
    HsUtilsService,
    HsLayerUtilsService,
    HsMapService,
    HsLayermanagerService,
    $rootScope,
    HsLayermanagerWmstService,
    HsLayoutService,
    HsLayerEditorSublayerService,
    HsLayerSynchronizerService
  ) {
    'ngInject';
    $scope.LayerManager = HsLayermanagerService;
    $scope.data = HsLayermanagerService.data;
    $scope.HsCore = HsCore;
    $scope.utils = HsUtilsService;
    $scope.layoutService = HsLayoutService;
    let map;
    $scope.shiftDown = false;
    $scope.changeLayerVisibility = HsLayermanagerService.changeLayerVisibility;
    $scope.changeBaseLayerVisibility =
      HsLayermanagerService.changeBaseLayerVisibility;
    $scope.changeTerrainLayerVisibility =
      HsLayermanagerService.changeTerrainLayerVisibility;

    $scope.layerOrder = function (layer) {
      return layer.layer.get('position');
    };

    $scope.changePosition = function (layer, direction, $event) {
      const index = layer.layer.get('position');
      const layers = HsMapService.map.getLayers();
      let toIndex = index;
      if (direction) {
        // upwards
        const max = layers.getLength() - 1;
        if (index < max) {
          if ($event.shiftKey) {
            toIndex = max;
          } else {
            toIndex = index + 1;
          }
        }
      } else {
        //downwards
        let min;
        for (let i = 0; i < layers.getLength(); i++) {
          if (layers.item(i).get('base') != true) {
            min = i;
            break;
          }
        }
        if (index > min) {
          if ($event.shiftKey) {
            toIndex = min;
          } else {
            toIndex = index - 1;
          }
        }
      }
      const moveLayer = layers.item(index);
      layers.removeAt(index);
      layers.insertAt(toIndex, moveLayer);
      HsLayermanagerService.updateLayerOrder();
      $rootScope.$broadcast('layermanager.updated'); //Rebuild the folder contents
    };

    $scope.isLayerType = function (layer, type) {
      switch (type) {
        case 'wms':
          return HsLayermanagerService.isWms(layer);
        case 'point':
          return layer.getSource().hasPoint;
        case 'line':
          return layer.getSource().hasLine;
        case 'polygon':
          return layer.getSource().hasPoly;
        default:
          return false;
      }
    };

    $scope.setProp = function (layer, property, value) {
      layer.set(property, value);
    };

    $scope.changePointType = function (layer, type) {
      if (angular.isUndefined(layer.style)) {
        $scope.getLayerStyle(layer);
      }
      layer.style.pointType = type;
      $scope.setLayerStyle(layer);
    };

    $scope.icons = [
      'bag1.svg',
      'banking4.svg',
      'bar.svg',
      'beach17.svg',
      'bicycles.svg',
      'building103.svg',
      'bus4.svg',
      'cabinet9.svg',
      'camping13.svg',
      'caravan.svg',
      'church15.svg',
      'church1.svg',
      'coffee-shop1.svg',
      'disabled.svg',
      'favourite28.svg',
      'football1.svg',
      'footprint.svg',
      'gift-shop.svg',
      'gps40.svg',
      'gps41.svg',
      'gps42.svg',
      'gps43.svg',
      'gps5.svg',
      'hospital.svg',
      'hot-air-balloon2.svg',
      'information78.svg',
      'library21.svg',
      'location6.svg',
      'luggage13.svg',
      'monument1.svg',
      'mountain42.svg',
      'museum35.svg',
      'park11.svg',
      'parking28.svg',
      'pharmacy17.svg',
      'port2.svg',
      'restaurant52.svg',
      'road-sign1.svg',
      'sailing-boat2.svg',
      'ski1.svg',
      'swimming26.svg',
      'telephone119.svg',
      'toilets2.svg',
      'train-station.svg',
      'university2.svg',
      'warning.svg',
      'wifi8.svg',
    ];

    $scope.activateTheme = HsLayermanagerService.activateTheme;

    /**
     * @function toggleCurrentLayer
     * @memberOf hs.layermanager.controller
     * @description Opens detailed panel for manipulating selected layer and viewing metadata
     * @param {object} layer Selected layer to edit or view - Wrapped layer object
     * @param {number} index Position of layer in layer manager structure - used to position the detail panel after layers li element
     */

    $scope.setCurrentLayer = function (layer) {
      HsLayermanagerService.currentLayer = layer;
      if (!layer.layer.checkedSubLayers) {
        layer.layer.checkedSubLayers = {};
        layer.layer.withChildren = {};
      }
      HsLayerEditorSublayerService.checkedSubLayers =
        layer.layer.checkedSubLayers;
      HsLayerEditorSublayerService.withChildren = layer.layer.withChildren;

      if (HsLayermanagerWmstService.layerIsWmsT(layer)) {
        HsLayermanagerService.currentLayer.time = new Date(
          layer.layer.getSource().getParams().TIME
        );
        HsLayermanagerService.currentLayer.date_increment = HsLayermanagerService.currentLayer.time.getTime();
      }
      const layerPanel = HsLayoutService.contentWrapper.querySelector(
        '.hs-layerpanel'
      );
      const layerNode = document.getElementById(layer.idString());
      HsUtilsService.insertAfter(layerPanel, layerNode);
      return false;
    };

    $scope.toggleCurrentLayer = function (layer) {
      if (HsLayermanagerService.currentLayer == layer) {
        layer.sublayers = false;
        layer.settings = false;
        HsLayermanagerService.currentLayer = null;

        HsLayerEditorSublayerService.checkedSubLayers = {};
        HsLayerEditorSublayerService.withChildren = {};
      } else {
        $scope.setCurrentLayer(layer);
        return false;
      }
    };
    /**
     * @function removeLayer
     * @memberOf hs.layermanager.controller
     * @description Removes layer from map object
     * @param {Ol.layer} layer Layer to remove
     */
    $scope.removeLayer = function (layer) {
      map.removeLayer(layer);
    };

    /**
     * @function removeAllLayers
     * @memberOf hs.layermanager.controller
     * @description Removes all layers which don't have 'removable' attribute set to false. If removal wasn´t confirmed display dialog first. Might reload composition again
     * @param {boolean} confirmed Whether removing was confirmed (by user/code), (true for confirmed, left undefined for not)
     * @param {boolean} loadComp Whether composition should be loaded again (true = reload composition, false = remove without reloading)
     */
    $scope.removeAllLayers = function (confirmed, loadComp) {
      if (typeof confirmed == 'undefined') {
        if (
          HsLayoutService.contentWrapper.querySelector(
            '.hs-remove-all-dialog'
          ) == null
        ) {
          const el = angular.element(
            '<div hs.layermanager.remove_all_dialog_directive></div>'
          );
          HsLayoutService.contentWrapper
            .querySelector('.hs-dialog-area')
            .appendChild(el[0]);
          $compile(el)($scope);
        } else {
          $scope.removeAllModalVisible = true;
        }
        return;
      }

      HsLayermanagerService.removeAllLayers();

      if (loadComp == true) {
        $rootScope.$broadcast(
          'compositions.load_composition',
          $scope.composition_id
        );
      }
    };

    /**
     * @function isLayerQueryable
     * @memberOf hs.layermanager.controller
     * @param {object} layer_container Selected layer - wrapped in layer object
     * @description Test if layer is queryable (WMS layer with Info format)
     */
    $scope.isLayerQueryable = function (layer_container) {
      HsLayerUtilsService.isLayerQueryable(layer_container.layer);
    };

    /**
     * @function toggleLayerEditor
     * @memberOf hs.layermanager.controller
     * @description Toggles Additional information panel for current layer.
     * @param {Ol.layer} layer Selected layer (LayerManager.currentLayer)
     * * @param {Ol.layer} toToggle Part of layer editor to be toggled
     * * @param {Ol.layer} control Part of layer editor to be controled for state.
     * Determines whether only toggled part or whole layereditor would be closed
     * @param toToggle
     * @param control
     */
    $scope.toggleLayerEditor = function (layer, toToggle, control) {
      if (toToggle == 'sublayers' && layer.layer.hasSublayers != true) {
        return;
      }
      if (HsLayermanagerService.currentLayer != layer) {
        $scope.toggleCurrentLayer(layer);
        layer[toToggle] = true;
      } else {
        layer[toToggle] = !layer[toToggle];
        if (!layer[control]) {
          $scope.toggleCurrentLayer(layer);
        }
      }
    };
    $scope.hasMetadata = function (layer) {
      if (!HsLayermanagerService.currentLayer) {
        return;
      } else {
        return layer.layer.get('MetadataURL') ? true : false;
      }
    };
    /**
     * @function hasCopyright
     * @memberOf hs.layermanager.controller
     * @description Determines if layer has copyright information avaliable *
     * @param {Ol.layer} layer Selected layer (LayerManager.currentLayer)
     */
    $scope.hasCopyright = function (layer) {
      if (!HsLayermanagerService.currentLayer) {
        return;
      } else {
        if (layer.layer.get('Attribution')) {
          const attr = layer.layer.get('Attribution');
          return attr.OnlineResource ? true : false;
        } else {
          return false;
        }
      }
    };

    /**
     * @function hasBoxLayers
     * @memberOf hs.layermanager.controller
     * @description Test if box layers are loaded
     */
    $scope.hasBoxImages = function () {
      if (angular.isDefined($scope.data.box_layers)) {
        for (let i = 0; i < $scope.data.box_layers.length; i++) {
          if ($scope.data.box_layers[i].get('img')) {
            return true;
          }
        }
      }
      return false;
    };

    /**
     * @function isLayerInResolutionInterval
     * @memberOf hs.layermanager.controller
     * @param {Ol.layer} lyr Selected layer
     * @description Test if layer (WMS) resolution is within map resolution interval
     */
    $scope.isLayerInResolutionInterval =
      HsLayermanagerService.isLayerInResolutionInterval;

    /**
     * @function layerLoaded
     * @memberOf hs.layermanager.controller
     * @param {Ol.layer} layer Selected layer
     * @description Test if selected layer is loaded in map
     */
    $scope.layerLoaded = HsLayerUtilsService.layerLoaded;

    /**
     * @function layerValid
     * @memberOf hs.layermanager.controller
     * @param {Ol.layer} layer Selected layer
     * @description Test if selected layer is valid (true for invalid)
     */
    $scope.layerValid = HsLayerUtilsService.layerInvalid;

    $scope.setLayerTime = HsLayermanagerWmstService.setLayerTime;

    $scope.$on('layer.removed', (event, layer) => {
      if (
        angular.isObject(HsLayermanagerService.currentLayer) &&
        HsLayermanagerService.currentLayer.layer == layer
      ) {
        const layerPanel = HsLayoutService.contentWrapper.querySelector(
          '.hs-layerpanel'
        );
        const layerNode = document.getElementsByClassName(
          'hs-lm-mapcontentlist'
        )[0];
        HsUtilsService.insertAfter(layerPanel, layerNode);
        HsLayermanagerService.currentLayer = null;
      }
    });

    $scope.$on('compositions.composition_loaded', (event, data) => {
      if (angular.isUndefined(data.error)) {
        if (angular.isDefined(data.data) && angular.isDefined(data.data.id)) {
          $scope.composition_id = data.data.id;
        } else if (angular.isDefined(data.id)) {
          $scope.composition_id = data.id;
        } else {
          delete $scope.composition_id;
        }
      }
    });

    $scope.$on('compositions.composition_deleted', (event, composition) => {
      if (composition.id == $scope.composition_id) {
        delete $scope.composition_id;
      }
    });

    $scope.$on('core.map_reset', (event) => {
      setTimeout(() => {
        delete $scope.composition_id;
      });
    });

    /**
     * @param m
     */
    function init(m) {
      map = HsMapService.map;
      HsLayerSynchronizerService.init(map);
    }

    HsMapService.loaded().then(init);

    $scope.$emit('scope_loaded', 'LayerManager');
  },
};
