import {Component, OnInit} from '@angular/core';
import {HsCoreService} from '../core/core.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsDialogItem} from '../layout/dialogs/dialog-item';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerEditorSublayerService} from './layer-editor.sub-layer.service';
import {HsLayerManagerRemoveAllDialogComponent} from './remove-all-dialog.component';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerManagerWmstService} from './layermanager-wmst.service';
import {HsLayerSynchronizerService} from '../save-map/layer-synchronizer.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Layer} from 'ol/layer';
import { HsLanguageService } from '../language/language.service';

@Component({
  selector: 'hs-layer-manager',
  template: require('./partials/layermanager.html'),
})
export class HsLayerManagerComponent implements OnInit {
  map: any;
  shiftDown = false;
  data: any;
  query: any = {title: undefined};
  layerlistVisible: boolean;

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

  constructor(
    private HsCore: HsCoreService,
    private HsUtilsService: HsUtilsService,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsMapService: HsMapService,
    private HsLayerManagerService: HsLayerManagerService,
    private HsLayermanagerWmstService: HsLayerManagerWmstService,
    private HsLayoutService: HsLayoutService,
    private HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    private HsLayerSynchronizerService: HsLayerSynchronizerService,
    private HsEventBusService: HsEventBusService,
    private HsDialogContainerService: HsDialogContainerService,
    private HsLanguageService: HsLanguageService
  ) {
    this.data = this.HsLayerManagerService.data;
    this.HsMapService.loaded().then((map) => this.init(map));

    this.HsEventBusService.layerRemovals.subscribe(
      (layer: HsLayerDescriptor) => {
        if (this.HsLayerManagerService?.currentLayer?.layer == layer) {
          const layerPanel = this.HsLayoutService.contentWrapper.querySelector(
            '.hs-layerpanel'
          );
          const layerNode = document.getElementsByClassName(
            'hs-lm-mapcontentlist'
          )[0];
          this.HsUtilsService.insertAfter(layerPanel, layerNode);
          this.HsLayerManagerService.currentLayer = null;
        }
      }
    );

    this.HsEventBusService.compositionLoads.subscribe((data) => {
      if (data.error == undefined) {
        if (data.data != undefined && data.data.id != undefined) {
          this.HsLayerManagerService.composition_id = data.data.id;
        } else if (data.id != undefined) {
          this.HsLayerManagerService.composition_id = data.id;
        } else {
          this.HsLayerManagerService.composition_id = null;
        }
      }
    });

    this.HsEventBusService.compositionDeletes.subscribe((composition) => {
      if (composition.id == this.HsLayerManagerService.composition_id) {
        this.HsLayerManagerService.composition_id = null;
      }
    });
  }

  ngOnInit(): void {
    this.layerlistVisible = true;
  }

  changeBaseLayerVisibility(toWhat: boolean, layer: Layer) {
    return this.HsLayerManagerService.changeBaseLayerVisibility(toWhat, layer);
  }

  changeTerrainLayerVisibility(e, layer: Layer) {
    return this.HsLayerManagerService.changeTerrainLayerVisibility(e, layer);
  }

  changeLayerVisibility(toWhat: boolean, layer: Layer) {
    return this.HsLayerManagerService.changeLayerVisibility(toWhat, layer);
  }

  layerOrder(layer: Layer) {
    return layer.layer.get('position');
  }

  changePosition(layer: Layer, direction, $event): void {
    const index = layer.layer.get('position');
    const layers = this.HsMapService.map.getLayers();
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
    this.HsEventBusService.layerManagerUpdates.next();
  }

  isLayerType(layer: Layer, type: string): boolean {
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
  }

  setProp(layer: Layer, property, value): void {
    layer.set(property, value);
  }

  activateTheme(e) {
    return this.HsLayerManagerService.activateTheme(e);
  }

  /**
   * @function removeLayer
   * @memberOf hs.layermanager.controller
   * @description Removes layer from map object
   * @param {Layer} layer Layer to remove
   */
  removeLayer(layer: Layer): void {
    this.map.removeLayer(layer);
  }

  /**
   * @function removeAllLayers
   * @memberOf hs.layermanager.controller
   * @description Removes all layers which don't have 'removable' attribute
   * set to false if user confirms the removal. Might reload composition again.
   */
  removeAllLayers(): void {
    this.HsDialogContainerService.create(
      HsLayerManagerRemoveAllDialogComponent,
      {}
    );
  }

  /**
   * @function hasCopyright
   * @memberOf hs.layermanager.controller
   * @description Determines if layer has copyright information avaliable *
   * @param {HsLayerDescriptor} layer Selected layer (HsLayerManagerService.currentLayer)
   */
  hasCopyright(layer: HsLayerDescriptor): boolean | undefined {
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
  }

  /**
   * @function hasBoxLayers
   * @memberOf hs.layermanager.controller
   * @description Test if box layers are loaded
   */
  hasBoxImages(): boolean {
    if (this.data.box_layers != undefined) {
      for (const layer of this.data.box_layers) {
        if (layer.get('img')) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * @function isLayerInResolutionInterval
   * @param layer
   * @memberOf hs.layermanager.controller
   * @param {Layer} lyr Selected layer
   * @description Test if layer (WMS) resolution is within map resolution interval
   */
  isLayerInResolutionInterval(layer: Layer): boolean {
    return this.HsLayerManagerService.isLayerInResolutionInterval(layer);
  }

  /**
   * @function layerLoaded
   * @memberOf hs.layermanager.controller
   * @param {Layer} layer Selected layer
   * @description Test if selected layer is loaded in map
   */
  layerLoaded(layer: Layer): boolean {
    return this.HsLayerUtilsService.layerLoaded(layer);
  }

  setLayerTime(layer: Layer, metadata) {
    return this.HsLayermanagerWmstService.setLayerTime(layer, metadata);
  }

  /**
   * @param m
   */
  init(m): void {
    this.map = this.HsMapService.map;
    this.HsLayerSynchronizerService.init(this.map);
    this.HsEventBusService.mapResets.subscribe(() => {
      this.HsLayerManagerService.composition_id = null;
    });
  }
}
