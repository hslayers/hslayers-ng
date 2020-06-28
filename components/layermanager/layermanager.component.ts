import { Component } from '@angular/core';
import { HsMapService } from '../map/map.service.js';
import { HsCoreService } from '../core/core.service.js';
import { HsLayerManagerService } from './layermanager.service.js';
import { HsLayerManagerWmstService } from './layermanager-wmst.service.js';
import { HsLayerEditorSublayerService } from './layer-editor.sub-layer.service.js';
import { HsEventBusService } from '../core/event-bus.service.js';
import { HsUtilsService, HsLayerUtilsService } from '../utils/utils.service';
import { HsLayoutService } from '../layout/layout.service.js';

@Component({
  selector: 'hs-layer-manager',
  template: require('./partials/layermanager.html')
})
export class HsLayerManagerComponent {

  map: any;
  shiftDown: boolean = false;
  data: any;
  composition_id: string;

  icons = [
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


  constructor(private HsCore: HsCoreService,
    private HsUtilsService: HsUtilsService,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsMapService: HsMapService,
    private HsLayerManagerService: HsLayerManagerService,
    private HsLayermanagerWmstService: HsLayerManagerWmstService,
    private HsLayoutService: HsLayoutService,
    private HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    private HsLayerSynchronizerService: HsLayerSynchronizerService,
    private HsEventBusService: HsEventBusService,
  ) {
    this.data = this.HsLayerManagerService.data;
    this.HsMapService.loaded().then(this.init);

    $scope.$on('layer.removed', (event, layer) => {
      if (
        typeof this.HsLayerManagerService.currentLayer == 'object' &&
        this.HsLayerManagerService.currentLayer.layer == layer
      ) {
        const layerPanel = this.HsLayoutService.contentWrapper.querySelector(
          '.hs-layerpanel'
        );
        const layerNode = document.getElementsByClassName(
          'hs-lm-mapcontentlist'
        )[0];
        this.HsUtilsService.insertAfter(layerPanel, layerNode);
        this.HsLayerManagerService.currentLayer = null;
      }
    });

    $scope.$on('compositions.composition_loaded', (event, data) => {
      if (data.error == undefined) {
        if (data.data != undefined && data.data.id != undefined) {
          this.composition_id = data.data.id;
        } else if (data.id != undefined) {
          this.composition_id = data.id;
        } else {
          delete this.composition_id;
        }
      }
    });

    $scope.$on('compositions.composition_deleted', (event, composition) => {
      if (composition.id == this.composition_id) {
        delete this.composition_id;
      }
    });
  }

  changeBaseLayerVisibility(toWhat: boolean, layer) {
    return this.HsLayerManagerService.changeBaseLayerVisibility(toWhat, layer);
  }

  changeTerrainLayerVisibility(e, layer) {
    return this.HsLayerManagerService.changeTerrainLayerVisibility(e, layer);
  }

  changeLayerVisibility(toWhat: boolean, layer) {
    return this.HsLayerManagerService.changeLayerVisibility(toWhat, layer);
  }

  layerOrder(layer) {
    return layer.layer.get('position');
  };

  changePosition(layer, direction, $event) {
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
    this.HsLayerManagerService.updateLayerOrder();
    $rootScope.$broadcast('layermanager.updated'); //Rebuild the folder contents
  };

  isLayerType(layer, type) {
    switch (type) {
      case 'wms':
        return this.HsLayerManagerService.isWms(layer);
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

  setProp(layer, property, value) {
    layer.set(property, value);
  };

  changePointType(layer, type) {
    if (layer.style == undefined) {
      getLayerStyle(layer);
    }
    layer.style.pointType = type;
    setLayerStyle(layer);
  };

  activateTheme(e) {
    return this.HsLayerManagerService.activateTheme(e)
  }

  /**
   * @function toggleCurrentLayer
   * @memberOf hs.layermanager.controller
   * @description Opens detailed panel for manipulating selected layer and viewing metadata
   * @param {object} layer Selected layer to edit or view - Wrapped layer object
   * @param {number} index Position of layer in layer manager structure - used to position the detail panel after layers li element
   */

  setCurrentLayer(layer) {
    this.HsLayerManagerService.currentLayer = layer;
    if (!layer.layer.checkedSubLayers) {
      layer.layer.checkedSubLayers = {};
      layer.layer.withChildren = {};
    }
    this.HsLayerEditorSublayerService.checkedSubLayers =
      layer.layer.checkedSubLayers;
    this.HsLayerEditorSublayerService.withChildren = layer.layer.withChildren;

    if (this.HsLayermanagerWmstService.layerIsWmsT(layer)) {
      this.HsLayerManagerService.currentLayer.time = new Date(
        layer.layer.getSource().getParams().TIME
      );
      this.HsLayerManagerService.currentLayer.date_increment = this.HsLayerManagerService.currentLayer.time.getTime();
    }
    const layerPanel = this.HsLayoutService.contentWrapper.querySelector(
      '.hs-layerpanel'
    );
    const layerNode = document.getElementById(layer.idString());
    this.HsUtilsService.insertAfter(layerPanel, layerNode);
    return false;
  };

  toggleCurrentLayer(layer) {
    if (this.HsLayerManagerService.currentLayer == layer) {
      layer.sublayers = false;
      layer.settings = false;
      this.HsLayerManagerService.currentLayer = null;

      this.HsLayerEditorSublayerService.checkedSubLayers = {};
      this.HsLayerEditorSublayerService.withChildren = {};
    } else {
      this.setCurrentLayer(layer);
      return false;
    }
  };
  /**
   * @function removeLayer
   * @memberOf hs.layermanager.controller
   * @description Removes layer from map object
   * @param {Ol.layer} layer Layer to remove
   */
  removeLayer(layer) {
    this.map.removeLayer(layer);
  };

  /**
   * @function removeAllLayers
   * @memberOf hs.layermanager.controller
   * @description Removes all layers which don't have 'removable' attribute set to false. If removal wasn´t confirmed display dialog first. Might reload composition again
   * @param {boolean} confirmed Whether removing was confirmed (by user/code), (true for confirmed, left undefined for not)
   * @param {boolean} loadComp Whether composition should be loaded again (true = reload composition, false = remove without reloading)
   */
  removeAllLayers(confirmed, loadComp) {
    if (typeof confirmed == 'undefined') {
      const el = angular.element(
        '<hs-layermanager-remove-all-dialog></hs-layermanager-remove-all-dialog>'
      );
      this.HsLayoutService.contentWrapper
        .querySelector('.hs-dialog-area')
        .appendChild(el[0]);
      $compile(el)($scope);
      return;
    }

    this.HsLayerManagerService.removeAllLayers();

    if (loadComp == true) {
      $rootScope.$broadcast(
        'compositions.load_composition',
        this.composition_id
      );
    }
  };

  /**
   * @function isLayerQueryable
   * @memberOf hs.layermanager.controller
   * @param {object} layer_container Selected layer - wrapped in layer object
   * @description Test if layer is queryable (WMS layer with Info format)
   */
  isLayerQueryable(layer_container) {
    this.HsLayerUtilsService.isLayerQueryable(layer_container.layer);
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
  toggleLayerEditor(layer, toToggle, control) {
    if (toToggle == 'sublayers' && layer.layer.hasSublayers != true) {
      return;
    }
    if (this.HsLayerManagerService.currentLayer != layer) {
      this.toggleCurrentLayer(layer);
      layer[toToggle] = true;
    } else {
      layer[toToggle] = !layer[toToggle];
      if (!layer[control]) {
        this.toggleCurrentLayer(layer);
      }
    }
  };
  hasMetadata(layer) {
    if (!this.HsLayerManagerService.currentLayer) {
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
  hasCopyright(layer) {
    if (!this.HsLayerManagerService.currentLayer) {
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
  hasBoxImages() {
    if (this.data.box_layers != undefined) {
      for (let layer of this.data.box_layers) {
        if (layer.get('img')) {
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
  isLayerInResolutionInterval(layer) {
    return this.HsLayerManagerService.isLayerInResolutionInterval(layer)
  }

  /**
   * @function layerLoaded
   * @memberOf hs.layermanager.controller
   * @param {Ol.layer} layer Selected layer
   * @description Test if selected layer is loaded in map
   */
  layerLoaded(layer) {
    return this.HsLayerUtilsService.layerLoaded(layer);
  }

  /**
   * @function layerValid
   * @memberOf hs.layermanager.controller
   * @param {Ol.layer} layer Selected layer
   * @description Test if selected layer is valid (true for invalid)
   */
  layerValid(layer) {
    return this.HsLayerUtilsService.layerInvalid(layer);
  }

  setLayerTime(layer, metadata) {
    return this.HsLayermanagerWmstService.setLayerTime(layer, metadata);
  }

  /**
   * @param m
   */
  init(m) {
    this.map = HsMapService.map;
    this.HsLayerSynchronizerService.init(this.map);
    this.HsEventBusService.mapResets.subscribe(() => {
      delete this.composition_id;
    });

  }
}

