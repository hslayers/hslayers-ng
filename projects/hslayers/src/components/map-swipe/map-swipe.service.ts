import {Injectable, NgZone} from '@angular/core';

import {Layer} from 'ol/layer';
import {Map} from 'ol';
import {Source} from 'ol/source';
import {first} from 'rxjs';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerManagerService} from '../layermanager/layermanager.service';
import {HsLayerShiftingService} from '../../common/layer-shifting/layer-shifting.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsToastService} from '../layout/toast/toast.service';
import {LayerListItem} from './../../common/layer-shifting/layer-shifting.service';
import {SwipeControl} from './swipe-control/swipe.control.class';
import {
  getQueryFilter,
  getSwipeSide,
  setQueryFilter,
  setSwipeSide,
} from '../../common/layer-extensions';

export enum SwipeSide {
  Left = 'left',
  Right = 'right',
  Full = 'full',
}
@Injectable({
  providedIn: 'root',
})
export class HsMapSwipeService {
  swipeCtrl: SwipeControl;
  rightLayers: LayerListItem[] = [];
  leftLayers: LayerListItem[] = [];
  entireMapLayers: LayerListItem[] = [];
  movingSide = SwipeSide.Left;
  wasMoved: boolean;
  swipeControlActive: boolean;
  orientation: 'vertical' | 'horizontal';
  orientationVertical = true;
  constructor(
    public hsMapService: HsMapService,
    public hsConfig: HsConfig,
    public hsToastService: HsToastService,
    public hsLayerShiftingService: HsLayerShiftingService,
    public hsEventBusService: HsEventBusService,
    public hsLayerManagerService: HsLayerManagerService,
    public hsShareUrlService: HsShareUrlService,
    public hsLayoutService: HsLayoutService,
    private zone: NgZone
  ) {
    this.swipeCtrl = null;
    this.rightLayers = [];
    this.leftLayers = [];
    this.entireMapLayers = [];
    this.movingSide = SwipeSide.Left;
    this.orientationVertical = true;
    this.wasMoved = null;
    this.swipeControlActive = null;
    this.orientation = null;

    this.setInitCtrlActive();
    this.setInitOri();
    this.hsMapService.loaded().then(() => {
      if (this.hsLayoutService.panelEnabled('mapSwipe')) {
        this.initSwipeControl();
      }
    });
    this.hsEventBusService.layerManagerUpdates.pipe(first()).subscribe(() => {
      if (this.hsLayoutService.panelEnabled('mapSwipe')) {
        this.setInitialSwipeLayers();
      }
    });
    //FIX ME : THIS SEEMS SKETCHY
    this.hsEventBusService.layerManagerUpdates.subscribe((layer) => {
      if (this.hsLayoutService.panelEnabled('mapSwipe')) {
        this.fillSwipeLayers(layer);
      }
    });
  }

  /**
   * Set initial map-swipe control state
   
   */
  setInitCtrlActive(): void {
    const param = this.hsShareUrlService.getParamValue('map-swipe');
    if (param) {
      switch (param) {
        case 'enabled':
          this.swipeControlActive = true;
          break;
        default:
          this.swipeControlActive = false;
          break;
      }
    } else {
      this.swipeControlActive =
        this.hsConfig?.componentsEnabled?.mapSwipe ?? false;
    }
    this.updateUrlParam();
  }

  /**
   * Set initial orientation value
   
   */
  setInitOri(): void {
    const storageOri = localStorage.getItem(`$:hs_map_swipe_ori`) as
      | 'vertical'
      | 'horizontal';
    if (storageOri) {
      this.orientation = storageOri;
    } else {
      this.orientation =
        this.hsConfig?.mapSwipeOptions?.orientation ?? 'vertical';
    }
    if (this.orientation !== 'vertical') {
      this.orientationVertical = false;
    }
    this.updateStorageOri();
  }
  /**
   * Initializes swipe control add adds it to the map
   
   */
  initSwipeControl(): void {
    this.zone.runOutsideAngular(() => {
      this.swipeCtrl = new SwipeControl({
        orientation: this.orientation,
      });
    });

    if (this.swipeControlActive) {
      this.swipeCtrl.setTargetMap(this.hsMapService.getMap());
      this.hsMapService.getMap().addControl(this.swipeCtrl);
    }
  }

  /**
   * Update local storage orientation value
   
   */
  updateStorageOri(): void {
    localStorage.setItem(`$:hs_map_swipe_ori`, this.orientation);
  }

  /**
   * Update url params to include map swipe state
   
   */
  updateUrlParam(): void {
    this.hsShareUrlService.updateCustomParams({
      'map-swipe': this.swipeControlActive ? 'enabled' : 'disabled',
    });
  }

  /**
   * Check if any layers are added to the swipe control
   
   */
  layersAvailable(): boolean {
    if (this == undefined) {
      return false;
    }
    return (
      this.swipeCtrl?.leftLayers?.length > 0 ||
      this.swipeCtrl?.rightLayers?.length > 0 ||
      this.entireMapLayers?.length > 0
    );
  }

  /**
   * Set swipe control orientation
   
   */
  setOrientation(): void {
    this.orientationVertical = !this.orientationVertical;
    this.orientation = this.orientationVertical ? 'vertical' : 'horizontal';
    this.swipeCtrl.set('orientation', this.orientation);
    this.updateStorageOri();
  }
  /**
   * Fill swipe control layers
   * @param layer - layer issued from layerManagerUpdates event
   
   */
  fillSwipeLayers(layer: Layer<Source> | void): void {
    this.hsLayerShiftingService.fillLayers();
    if (!layer) {
      return;
    }
    const layerFound = this.hsLayerShiftingService.layersCopy.find(
      (wrapper) => wrapper.layer == layer
    );
    if (layerFound !== undefined) {
      this.setLayerActive(layerFound);
      this.wasMoved
        ? this.moveSwipeLayer(layerFound)
        : this.addSwipeLayer(layerFound);
      this.checkForMissingLayers();
    } else {
      this.removeCompletely(layer);
    }
    this.sortLayers();
    this.wasMoved = false;
    this.movingSide = SwipeSide.Left;
  }

  /**
   * Move a layer to swipe control
   * @param layerItem - layer issued from layerManagerUpdates event
   
   */
  addSwipeLayer(layerItem: LayerListItem): void {
    if (!this.swipeCtrl) {
      this.initSwipeControl();
    }
    this.createQueryFilter(layerItem);
    if (!this.findLayer(layerItem.layer)?.l) {
      layerItem.visible = layerItem.layer.getVisible();
      if (getSwipeSide(layerItem.layer) === 'right') {
        this.swipeCtrl.addLayer(layerItem, true);
        this.rightLayers.push(layerItem);
      } else if (getSwipeSide(layerItem.layer) === 'left') {
        this.swipeCtrl.addLayer(layerItem);
        this.leftLayers.push(layerItem);
      } else {
        this.entireMapLayers.push(layerItem);
      }
      layerItem.layer.on('change:visible', (e) =>
        this.layerVisibilityChanged(e)
      );
    }
  }

  /**
   * Crate queryFilter callback function for layer and set it as layer's property
   * Query will work for the layer, if the user's click was made on the same map swipe panel
   * where the layer is being rendered
   * If the layer swipe side is not specified, query will work by default
   * @param layerItem - layer issued from layerManagerUpdates event
   
   */
  createQueryFilter(layerItem: LayerListItem): void {
    const existingFilter = getQueryFilter(layerItem.layer);
    const filter = (map: Map, layer: Layer, pixel: number[]) => {
      let swipeFilter: boolean;
      const swipeSide: 'left' | 'right' = getSwipeSide(layer);
      if (!this.swipeControlActive || !swipeSide) {
        swipeFilter = true;
      } else {
        const clickPos =
          this.orientation == 'vertical'
            ? this.swipeCtrl.getPosValue(map.getSize()[0], pixel[0])
            : this.swipeCtrl.getPosValue(map.getSize()[1], pixel[1]);

        if (
          (clickPos <= this.swipeCtrl.get('position') && swipeSide == 'left') ||
          (clickPos > this.swipeCtrl.get('position') && swipeSide == 'right')
        ) {
          swipeFilter = true;
        } else {
          swipeFilter = false;
        }
      }
      if (existingFilter != undefined) {
        return existingFilter(map, layer, pixel) && swipeFilter;
      } else {
        return swipeFilter;
      }
    };
    setQueryFilter(layerItem.layer, filter);
  }
  /**
   * Move a layer to swipe control
   * @param lyrListItem - layer issued from layerManagerUpdates event
   
   */
  moveSwipeLayer(lyrListItem: LayerListItem): void {
    if (this.movingSide === SwipeSide.Right) {
      this.moveRight(lyrListItem);
      setSwipeSide(lyrListItem.layer, 'right');
    }
    if (this.movingSide === SwipeSide.Left) {
      this.moveLeft(lyrListItem);
      setSwipeSide(lyrListItem.layer, 'left');
    }
    if (this.movingSide === SwipeSide.Full) {
      setSwipeSide(lyrListItem.layer, undefined);
      this.swipeCtrl.removeCompletely(lyrListItem.layer);
    }
  }
  /**
   * Move a layer to swipe control right side
   * @param layer - layer issued from layerManagerUpdates event
   
   */
  moveRight(layer: LayerListItem): void {
    this.swipeCtrl.removeLayer(layer);
    this.swipeCtrl.addLayer(layer, true);
  }
  /**
   * Move a layer to swipe control left side
   * @param layer - layer issued from layerManagerUpdates event
   
   */
  moveLeft(layer: LayerListItem): void {
    this.swipeCtrl.removeLayer(layer, true);
    this.swipeCtrl.addLayer(layer);
  }

  /**
   * Set map swipe control status enabled/disabled
   
   */
  setControl(): void {
    this.swipeControlActive = !this.swipeControlActive;
    this.updateUrlParam();
    if (!this.hsMapService.getMap()) {
      return;
    }
    if (this.swipeControlActive) {
      this.swipeCtrl.setTargetMap(this.hsMapService.getMap());
      this.hsMapService.getMap().addControl(this.swipeCtrl);
      this.swipeCtrl.setEvents(true);
    } else {
      this.hsMapService.getMap().removeControl(this.swipeCtrl);
      this.swipeCtrl.setEvents();
    }
    try {
      this.hsMapService.getMap().renderSync();
    } catch (e) {
      console.error(e);
    }
  }
  /**
   * Remove layer completely
   * @param layer - layer issued from layerManagerUpdates event
   
   */
  removeCompletely(layerToRm: Layer<Source>): void {
    const layerFound = this.findLayer(layerToRm);
    if (layerFound.l) {
      if (layerFound.arr === 'layers') {
        this.leftLayers = this.leftLayers.filter((l) => l.layer != layerToRm);
      }
      if (layerFound.arr === 'rightLayers') {
        this.rightLayers = this.rightLayers.filter((l) => l.layer != layerToRm);
      }
      if (layerFound.arr === 'entireMapLayers') {
        this.entireMapLayers = this.entireMapLayers.filter(
          (l) => l.layer != layerToRm
        );
      }
    }
    this.swipeCtrl.removeCompletely(layerToRm);
  }
  /**
   * Set layer as active (last dragged)
   * @param layer - layer issued from layerManagerUpdates event
   
   */
  setLayerActive(layer: LayerListItem): void {
    const layerFound = this.findLayer(layer.layer);
    this.leftLayers.forEach((l) => (l.active = false));
    this.rightLayers.forEach((l) => (l.active = false));
    this.entireMapLayers.forEach((l) => (l.active = false));
    if (layerFound?.l) {
      layerFound.l.active = true;
    }
  }
  /**
   * Set and add initial swipe control layers
   
   */
  setInitialSwipeLayers(): void {
    const layerShiftingthis = this.hsLayerShiftingService;
    this.leftLayers = [];
    this.rightLayers = [];
    this.entireMapLayers = [];
    this.hsLayerShiftingService.fillLayers();
    if (!layerShiftingthis.layersCopy) {
      return;
    }
    for (const layer of layerShiftingthis.layersCopy) {
      this.addSwipeLayer(layer);
    }
    this.sortLayers();
  }
  /**
   * Check if any layer is left out from swipe control and add it
   
   */
  checkForMissingLayers(): void {
    const missingLayers = this.hsLayerShiftingService.layersCopy.filter((l) => {
      return !this.findLayer(l.layer)?.l;
    });
    for (const layer of missingLayers) {
      this.addSwipeLayer(layer);
    }
    this.sortLayers();
  }

  /**
   * Sort layers to resemple layer order by ZIndex on the map
   
   */
  sortLayers(): void {
    this.leftLayers = this.hsLayerManagerService.sortLayersByZ(this.leftLayers);
    this.rightLayers = this.hsLayerManagerService.sortLayersByZ(
      this.rightLayers
    );
    this.entireMapLayers = this.hsLayerManagerService.sortLayersByZ(
      this.entireMapLayers
    );
  }

  /**
   * Change layer visibility
   * @param layerItem - Layer item selected
   */
  changeLayerVisibility(layerItem: LayerListItem): void {
    layerItem.layer.setVisible(!layerItem.layer.getVisible());
    layerItem.visible = layerItem.layer.getVisible();
  }

  /**
   * Act upon layer visibility changes
   * @param e - Event description
   
   */
  layerVisibilityChanged(e): void {
    const found = this.findLayer(e.target);
    if (found.l) {
      found.l.visible = e.target.getVisible();
    }
  }

  /**
   * Find layer based on layer source
   * @param targetLayer - Layer to be found
   
   */
  findLayer(targetLayer: Layer<Source>): {l: LayerListItem; arr: string} {
    const found = {l: null, arr: ''};
    found.l = this.leftLayers.find((lyr) => lyr.layer == targetLayer);
    found.arr = 'layers';
    if (!found.l) {
      found.l = this.rightLayers.find((lyr) => lyr.layer == targetLayer);
      found.arr = 'rightLayers';
    }
    if (!found.l) {
      found.l = this.entireMapLayers.find((lyr) => lyr.layer == targetLayer);
      found.arr = 'entireMapLayers';
    }
    return found;
  }
}
