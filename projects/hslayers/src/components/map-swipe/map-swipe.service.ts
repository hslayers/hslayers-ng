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

@Injectable({
  providedIn: 'root',
})
export class HsMapSwipeService {
  swipeCtrl: SwipeControl;
  rightLayers: LayerListItem[] = [];
  layers: LayerListItem[] = [];
  movingRight: boolean;
  wasMoved: boolean;
  constructor(
    public hsMapService: HsMapService,
    public hsConfig: HsConfig,
    public hsToastService: HsToastService,
    public hsLayerShiftingService: HsLayerShiftingService,
    public hsEventBusService: HsEventBusService,
    public hsLayerManagerService: HsLayerManagerService
  ) {
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
      orientation: this.hsConfig?.mapSwipeOrientation ?? 'vertical',
    });
    this.swipeCtrl.setTargetMap(this.hsMapService.map);
    this.hsMapService.map.addControl(this.swipeCtrl);
  }
  /**
   * Check if any layers are added to the swipe control
   */
  layersAvailable(): boolean {
    return (
      this.swipeCtrl?.layers?.length > 0 ||
      this.swipeCtrl?.rightLayers?.length > 0
    );
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
    this.movingRight = false;
    this.wasMoved = false;
  }

  /**
   * Move a layer to swipe control
   * @param layer - layer issued from layerManagerUpdates event
   */
  addSwipeLayer(layer: LayerListItem): void {
    if (
      this.layers.filter((l) => l.layer == layer.layer).length == 0 &&
      this.rightLayers.filter((l) => l.layer == layer.layer).length == 0
    ) {
      if (
        (this.hsConfig.initialSwipeRight &&
          this.hsConfig.initialSwipeRight.includes(layer.layer)) ||
        getSwipeSide(layer.layer) === 2
      ) {
        this.swipeCtrl.addLayer(layer, true);
        this.rightLayers.push(layer);
      } else {
        this.swipeCtrl.addLayer(layer);
        this.layers.push(layer);
      }
    }
  }
  /**
   * Move a layer to swipe control
   * @param layer - layer issued from layerManagerUpdates event
   */
  moveSwipeLayer(layer: LayerListItem): void {
    if (this.movingRight) {
      this.moveRight(layer);
    } else {
      this.moveLeft(layer);
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
   * Add layer to swipe control left side
   * @param enabled - (Optional) If true, map swipe control is enabled, else it is removed
   */
  setControl(enabled?: boolean): void {
    if (!this.hsMapService.map) {
      return;
    }
    if (enabled) {
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
    this.layers = this.layers.filter((l) => l.layer != layerToRm);
    this.rightLayers = this.rightLayers.filter((l) => l.layer != layerToRm);
    this.swipeCtrl.removeCompletely(layerToRm);
  }
  /**
   * Set layer as active (last dragged)
   * @param layer - layer issued from layerManagerUpdates event
   */
  setLayerActive(layer: LayerListItem): void {
    this.layers.forEach((l) => {
      l.layer == layer.layer ? (l.active = true) : (l.active = false);
    });
    this.rightLayers.forEach((l) => {
      l.layer == layer.layer ? (l.active = true) : (l.active = false);
    });
  }
  /**
   * Set and add initial swipe control layers
   */
  setInitialSwipeLayers(): void {
    this.layers = [];
    this.hsLayerShiftingService.fillLayers();
    if (!this.hsLayerShiftingService.layersCopy) {
      return;
    }
    this.fillExplicitLayers();
    if (
      !this.hsConfig.initialSwipeRight ||
      this.hsConfig.initialSwipeRight.length == 0
    ) {
      this.hsToastService.createToastPopupMessage(
        'MAP_SWIPE.swipeMapWarning',
        'MAP_SWIPE.initialSwipeRightNot'
      );
    } else {
      const initialLayers = this.hsLayerShiftingService.layersCopy.filter((l) =>
        this.hsConfig.initialSwipeRight.includes(l.layer)
      );
      this.rightLayers = this.rightLayers.concat(
        initialLayers.filter((l) => !this.rightLayers.includes(l))
      );
    }
    this.layers = this.layers.concat(
      this.hsLayerShiftingService.layersCopy
        .filter((l) => !this.layers.includes(l))
        .filter((l) => !this.rightLayers.includes(l))
    );
    this.addSwipeLayers();
  }
  /**
   * Check if any layer is left out from swipe control and add it
   */
  checkForMissingLayers(): void {
    const missingLayers = this.hsLayerShiftingService.layersCopy
      .filter((l) => {
        return !this.layers.find((lyr) => lyr.layer == l.layer);
      })
      .filter((l) => {
        return !this.rightLayers.find((lyr) => lyr.layer == l.layer);
      });
    this.layers = this.layers.concat(
      missingLayers.filter(
        (l) => getSwipeSide(l.layer) == 1 || !getSwipeSide(l.layer)
      )
    );
    this.rightLayers = this.rightLayers.concat(
      missingLayers.filter((l) => getSwipeSide(l.layer) == 2)
    );
    this.addSwipeLayers();
  }

  /**
   * Add explicit layers with swipeSide property set
   */
  fillExplicitLayers(): void {
    this.layers = this.hsLayerShiftingService.layersCopy.filter(
      (lyr) => getSwipeSide(lyr.layer) == 1
    );
    this.rightLayers = this.hsLayerShiftingService.layersCopy.filter(
      (lyr) => getSwipeSide(lyr.layer) == 2
    );
  }

  /**
   * Add swipe layers array to swipe control
   */
  addSwipeLayers(): void {
    this.sortLayers();
    this.swipeCtrl.addLayers(this.rightLayers, true);
    this.swipeCtrl.addLayers(this.layers);
  }

  /**
   * Sort layers to resemple layer order by ZIndex on the map
   */
  sortLayers(): void {
    this.layers = this.hsLayerManagerService.sortLayersByZ(this.layers);
    this.rightLayers = this.hsLayerManagerService.sortLayersByZ(
      this.rightLayers
    );
  }
}
