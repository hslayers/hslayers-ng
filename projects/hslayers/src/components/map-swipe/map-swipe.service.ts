import {Injectable} from '@angular/core';
import {first} from 'rxjs';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
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
  constructor(
    public hsMapService: HsMapService,
    public hsConfig: HsConfig,
    public hsToastService: HsToastService,
    public hsLayerShiftingService: HsLayerShiftingService,
    public hsEventBusService: HsEventBusService
  ) {
    this.hsMapService.loaded().then(() => {
      this.swipeCtrl = new SwipeControl({
        orientation: this.hsConfig?.mapSwipeOrientation ?? 'vertical',
      });
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
    this.hsEventBusService.mapResets.subscribe(() => {
      this.setInitialSwipeLayers();
    });
  }
  /**
   * Initializes swipe control add adds it to the map
   */
  init(): void {
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
      this.addSwipeLayer(layerFound);
      this.checkForMissingLayers();
    } else {
      this.removeCompletely(layer);
    }
  }
  /**
   * Add a layer to swipe control
   * @param layer - layer issued from layerManagerUpdates event
   */
  addSwipeLayer(layer: LayerListItem): void {
    if (this.movingRight) {
      this.addRight(layer);
    } else {
      this.addLeft(layer);
    }
    this.movingRight = false;
  }
  /**
   * Add layer to swipe control right side
   * @param layer - layer issued from layerManagerUpdates event
   */
  addRight(layer: LayerListItem): void {
    this.swipeCtrl.removeLayer(layer);
    this.swipeCtrl.addLayer(layer, true);
  }
  /**
   * Add layer to swipe control left side
   * @param layer - layer issued from layerManagerUpdates event
   */
  addLeft(layer: LayerListItem): void {
    this.swipeCtrl.removeLayer(layer, true);
    this.swipeCtrl.addLayer(layer);
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
    this.swipeCtrl.addLayers(this.rightLayers, true);
    this.swipeCtrl.addLayers(this.layers);
  }
}
