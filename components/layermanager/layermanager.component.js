export default {
  template: [
    'config',
    (config) => {
      if (config.design == 'md') {
        return require('./partials/layermanagermd.html');
      } else {
        return require('./partials/layermanager.html');
      }
    },
  ],
  controller: [
    '$scope',
    'Core',
    '$compile',
    'hs.utils.service',
    'hs.utils.layerUtilsService',
    'config',
    'hs.map.service',
    'hs.layermanager.service',
    '$rootScope',
    'hs.layermanager.WMSTservice',
    'hs.legend.service',
    'hs.layout.service',
    'hs.layerEditor.sublayerService',
    'hs.layerSynchronizerService',
    function (
      $scope,
      Core,
      $compile,
      utils,
      layerUtils,
      config,
      OlMap,
      LayMan,
      $rootScope,
      WMST,
      legendService,
      layoutService,
      subLayerService,
      layerSynchronizerService
    ) {
      $scope.LayMan = LayMan;
      $scope.data = LayMan.data;
      $scope.Core = Core;
      $scope.utils = utils;
      $scope.layoutService = layoutService;
      let map;
      $scope.shiftDown = false;
      $scope.changeLayerVisibility = LayMan.changeLayerVisibility;
      $scope.changeBaseLayerVisibility = LayMan.changeBaseLayerVisibility;
      $scope.changeTerrainLayerVisibility = LayMan.changeTerrainLayerVisibility;

      $scope.layerOrder = function (layer) {
        return layer.layer.get('position');
      };

      $scope.changePosition = function (layer, direction, $event) {
        const index = layer.layer.get('position');
        const layers = OlMap.map.getLayers();
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
        LayMan.updateLayerOrder();
        $rootScope.$broadcast('layermanager.updated'); //Rebuild the folder contents
      };

      $scope.isLayerType = function (layer, type) {
        switch (type) {
          case 'wms':
            return LayMan.isWms(layer);
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
          getLayerStyle(layer);
        }
        layer.style.pointType = type;
        setLayerStyle(layer);
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

      $scope.activateTheme = LayMan.activateTheme;

      /**
       * @function toggleCurrentLayer
       * @memberOf hs.layermanager.controller
       * @description Opens detailed panel for manipulating selected layer and viewing metadata
       * @param {object} layer Selected layer to edit or view - Wrapped layer object
       * @param {number} index Position of layer in layer manager structure - used to position the detail panel after layers li element
       */

      $scope.setCurrentLayer = function (layer) {
        LayMan.currentLayer = layer;

        if (!layer.layer.checkedSubLayers) {
          layer.layer.checkedSubLayers = {};
          layer.layer.withChildren = {};
        }
        subLayerService.checkedSubLayers = layer.layer.checkedSubLayers;
        subLayerService.withChildren = layer.layer.withChildren;

        if (WMST.layerIsWmsT(layer)) {
          LayMan.currentLayer.time = new Date(
            layer.layer.getSource().getParams().TIME
          );
          LayMan.currentLayer.date_increment = LayMan.currentLayer.time.getTime();
        }
        const layerPanel = layoutService.contentWrapper.querySelector(
          '.hs-layerpanel'
        );
        const layerNode = document.getElementById(layer.idString());
        utils.insertAfter(layerPanel, layerNode);
        return false;
      };

      $scope.toggleCurrentLayer = function (layer) {
        if (LayMan.currentLayer == layer) {
          layer.sublayers = false;
          layer.settings = false;
          LayMan.currentLayer = null;

          subLayerService.checkedSubLayers = {};
          subLayerService.withChildren = {};
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
       * @param {Boolean} confirmed Whether removing was confirmed (by user/code), (true for confirmed, left undefined for not)
       * @param {Boolean} loadComp Whether composition should be loaded again (true = reload composition, false = remove without reloading)
       */
      $scope.removeAllLayers = function (confirmed, loadComp) {
        if (typeof confirmed == 'undefined') {
          if (
            layoutService.contentWrapper.querySelector(
              '.hs-remove-all-dialog'
            ) == null
          ) {
            const el = angular.element(
              '<div hs.layermanager.remove_all_dialog_directive></div>'
            );
            layoutService.contentWrapper
              .querySelector('.hs-dialog-area')
              .appendChild(el[0]);
            $compile(el)($scope);
          } else {
            $scope.removeAllModalVisible = true;
          }
          return;
        }

        LayMan.removeAllLayers();

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
        layerUtils.isLayerQueryable(layer_container.layer);
      };

      /**
       * @function toggleLayerEditor
       * @memberOf hs.layermanager.controller
       * @description Toggles Additional information panel for current layer.
       * @param {Ol.layer} layer Selected layer (LayMan.currentLayer)
       * * @param {Ol.layer} toToggle Part of layer editor to be toggled
       * * @param {Ol.layer} control Part of layer editor to be controled for state. 
       * Determines whether only toggled part or whole layereditor would be closed
       */
      $scope.toggleLayerEditor = function (layer, toToggle, control) {
        if (toToggle == 'sublayers' && layer.layer.hasSublayers != true ) {return};
        if (LayMan.currentLayer != layer) {
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
        if (!LayMan.currentLayer) {
          return;
        } else {
          return layer.layer.get('MetadataURL') ? true : false;
        }
      };
      /**
       * @function hasCopyright
       * @memberOf hs.layermanager.controller
       * @description Determines if layer has copyright information avaliable *
       * @param {Ol.layer} layer Selected layer (LayMan.currentLayer)
       */
      $scope.hasCopyright = function (layer) {
        if (!LayMan.currentLayer) {
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
      $scope.isLayerInResolutionInterval = LayMan.isLayerInResolutionInterval;

      /**
       * @function layerLoaded
       * @memberOf hs.layermanager.controller
       * @param {Ol.layer} layer Selected layer
       * @description Test if selected layer is loaded in map
       */
      $scope.layerLoaded = layerUtils.layerLoaded;

      /**
       * @function layerValid
       * @memberOf hs.layermanager.controller
       * @param {Ol.layer} layer Selected layer
       * @description Test if selected layer is valid (true for invalid)
       */
      $scope.layerValid = layerUtils.layerInvalid;

      $scope.setLayerTime = WMST.setLayerTime;

      $scope.$on('layer.removed', (event, layer) => {
        if (
          angular.isObject(LayMan.currentLayer) &&
          LayMan.currentLayer.layer == layer
        ) {
          const layerPanel = layoutService.contentWrapper.querySelector(
            '.hs-layerpanel'
          );
          const layerNode = document.getElementsByClassName(
            'hs-lm-mapcontentlist'
          )[0];
          utils.insertAfter(layerPanel, layerNode);
          LayMan.currentLayer = null;
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
        $timeout(() => {
          delete $scope.composition_id;
        });
      });

      function init(m) {
        map = OlMap.map;
        layerSynchronizerService.init(map);
      }

      OlMap.loaded().then(init);

      $scope.$emit('scope_loaded', 'LayerManager');
    },
  ],
};
