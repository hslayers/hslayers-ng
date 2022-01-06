import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {first} from 'rxjs';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerManagerService} from '../layermanager/layermanager.service';
import {HsLayerShiftingService} from '../../common/layer-shifting/layer-shifting.service';
import {HsMapService} from '../map/map.service';
import {HsToastService} from '../layout/toast/toast.service';
import {LayerListItem} from './../../common/layer-shifting/layer-shifting.service';
import {SwipeControl} from './swipe-control/swipe.control.class';
import {getSwipeSide} from '../../common/layer-extensions';

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
  layers: LayerListItem[] = [];
  entireMapLayers: LayerListItem[] = [];
  movingSide = SwipeSide.Left;
  wasMoved: boolean;
  swipeControlActive: boolean;
  orientation: string;
  orientationVertical = true;
  constructor(
    public hsMapService: HsMapService,
    public hsConfig: HsConfig,
    public hsToastService: HsToastService,
    public hsLayerShiftingService: HsLayerShiftingService,
    public hsEventBusService: HsEventBusService,
    public hsLayerManagerService: HsLayerManagerService
  ) {
    this.swipeControlActive =
      this.hsConfig?.componentsEnabled?.mapSwipe ?? false;
    this.orientation =
      this.hsConfig?.mapSwipeOptions?.orientation ?? 'vertical';

    if (this.orientation !== 'vertical') {
      this.orientationVertical = false;
    }
    this.hsMapService.loaded().then(() => {
      this.init();
    });
    this.hsEventBusService.layerManagerUpdates
      .pipe(first())
      .subscribe(() => this.setInitialSwipeLayers());
    this.hsEventBusService.layerManagerUpdates.subscribe(
      (layer: Layer<Source>) => {
        this.fillSwipeLayers(layer);
      }
    );
  }
  /**
   * Initializes swipe control add adds it to the map
   */
  init(): void {
    this.swipeCtrl = new SwipeControl({
      orientation: this.orientation,
    });
    if (this.swipeControlActive) {
      this.swipeCtrl.setTargetMap(this.hsMapService.map);
      this.hsMapService.map.addControl(this.swipeCtrl);
    }
  }

  /**
   * Check if any layers are added to the swipe control
   */
  layersAvailable(): boolean {
    return (
      this.swipeCtrl?.layers?.length > 0 ||
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
  }
  /**
   * Fill swipe control layers
   * @param layer - layer issued from layerManagerUpdates event
   */
  fillSwipeLayers(layer: Layer<Source>): void {
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
   * @param layer - layer issued from layerManagerUpdates event
   */
  addSwipeLayer(layerItem: LayerListItem): void {
    if (!this.findLayer(layerItem.layer)?.l) {
      layerItem.visible = layerItem.layer.getVisible();
      if (getSwipeSide(layerItem.layer) === 'right') {
        this.swipeCtrl.addLayer(layerItem, true);
        this.rightLayers.push(layerItem);
      } else if (getSwipeSide(layerItem.layer) === 'left') {
        this.swipeCtrl.addLayer(layerItem);
        this.layers.push(layerItem);
      } else {
        this.entireMapLayers.push(layerItem);
      }
      layerItem.layer.on('change:visible', (e) =>
        this.layerVisibilityChanged(e)
      );
    }
  }
  /**
   * Move a layer to swipe control
   * @param layer - layer issued from layerManagerUpdates event
   */
  moveSwipeLayer(layer: LayerListItem): void {
    if (this.movingSide === SwipeSide.Right) {
      this.moveRight(layer);
    }
    if (this.movingSide === SwipeSide.Left) {
      this.moveLeft(layer);
    }
    if (this.movingSide === SwipeSide.Full) {
      this.swipeCtrl.removeCompletely(layer.layer);
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
    if (!this.hsMapService.map) {
      return;
    }
    if (this.swipeControlActive) {
      this.swipeCtrl.setTargetMap(this.hsMapService.map);
      this.hsMapService.map.addControl(this.swipeCtrl);
      this.swipeCtrl.setEvents(true);
    } else {
      this.hsMapService.map.removeControl(this.swipeCtrl);
      this.swipeCtrl.setEvents();
    }
    try {
      this.hsMapService.map.renderSync();
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
        this.layers = this.layers.filter((l) => l.layer != layerToRm);
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
    this.layers.forEach((l) => (l.active = false));
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
    this.layers = [];
    this.rightLayers = [];
    this.entireMapLayers = [];
    this.hsLayerShiftingService.fillLayers();
    if (!this.hsLayerShiftingService.layersCopy) {
      return;
    }
    for (const layer of this.hsLayerShiftingService.layersCopy) {
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
    this.layers = this.hsLayerManagerService.sortLayersByZ(this.layers);
    this.rightLayers = this.hsLayerManagerService.sortLayersByZ(
      this.rightLayers
    );
    this.entireMapLayers = this.hsLayerManagerService.sortLayersByZ(
      this.entireMapLayers
    );
  }

  /**
   * Change layer visibility
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
   */
  findLayer(targetLayer: Layer<Source>): {l: LayerListItem; arr: string} {
    const found = {l: null, arr: ''};
    found.l = this.layers.find((lyr) => lyr.layer == targetLayer);
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
