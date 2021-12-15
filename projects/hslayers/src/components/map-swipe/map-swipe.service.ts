import {Injectable} from '@angular/core';

import {HsConfig} from '../../config.service';
import {HsLayerShiftingService} from '../../common/layer-shifting/layer-shifting.service';
import {HsMapService} from '../map/map.service';
import {HsToastService} from '../layout/toast/toast.service';
import {LayerListItem} from './../../common/layer-shifting/layer-shifting.service';
import {SwipeControl} from './swipe-control/swipe.control.class';
import {getTitle} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsMapSwipeService {
  swipeCtrl = new SwipeControl();
  rightLayers: LayerListItem[] = [];
  layers: LayerListItem[] = [];
  movingRight: boolean;
  constructor(
    public hsMapService: HsMapService,
    public hsConfig: HsConfig,
    public hsToastService: HsToastService,
    public hsLayerShiftingService: HsLayerShiftingService
  ) {}

  init(): void {
    this.hsMapService.loaded().then(() => {
      this.swipeCtrl.setTargetMap(this.hsMapService.map);
      this.hsMapService.map.addControl(this.swipeCtrl);
      this.hsLayerShiftingService.fillLayers();
      if (
        !this.hsConfig.initialSwipeRight ||
        this.hsConfig.initialSwipeRight.length == 0
      ) {
        this.hsToastService.createToastPopupMessage(
          'MAP_SWIPE.swipeMapWarning',
          'Map_SWIPE.initialSwipeRightNot'
        );
        this.layers = Object.assign([], this.hsLayerShiftingService.layersCopy);
      } else {
        this.rightLayers = this.hsConfig.initialSwipeRight.map((l) => {
          return {layer: l, title: getTitle(l)};
        });
        this.layers = this.hsLayerShiftingService.layersCopy.filter(
          (l) => !this.hsConfig.initialSwipeRight.includes(l.layer)
        );
      }
      this.swipeCtrl.addLayer(this.rightLayers, true);
      this.swipeCtrl.addLayer(this.layers);
    });
  }

  layersAvailable(): boolean {
    return (
      this.swipeCtrl.layers?.length > 0 ||
      this.swipeCtrl.rightLayers?.length > 0
    );
  }

  fillSwipeLayers(layer: any): void {
    this.hsLayerShiftingService.fillLayers();
    if (layer !== undefined) {
      const layerFound = this.hsLayerShiftingService.layersCopy.find(
        (wrapper) => wrapper.layer == layer || wrapper.layer == layer.layer
      );
      if (layerFound !== undefined) {
        this.setLayerActive(layerFound);
        this.checkForMissingLayers();
        this.addSwipeLayers(layerFound);
      }
    }
  }

  addSwipeLayers(layer?: LayerListItem): void {
    if (this.movingRight) {
      this.swipeCtrl.removeLayer(layer);
      this.swipeCtrl.addLayer(layer, true);
    } else {
      this.swipeCtrl.removeLayer(layer, true);
      this.swipeCtrl.addLayer(layer);
    }
    this.movingRight = false;
  }

  setLayerActive(layer: LayerListItem): void {
    this.layers.forEach((l) => {
      l.layer == layer.layer ? (l.active = true) : (l.active = false);
    });
    this.rightLayers.forEach((l) => {
      l.layer == layer.layer ? (l.active = true) : (l.active = false);
    });
  }

  checkForMissingLayers(): void {
    let missingLayers = [];
    missingLayers = this.hsLayerShiftingService.layersCopy.filter((l) => {
      return !this.layers.find((lyr) => lyr.layer == l.layer);
    });
    missingLayers = missingLayers.filter((l) => {
      return !this.rightLayers.find((lyr) => lyr.layer == l.layer);
    });
    missingLayers.forEach((l) => {
      this.layers.push(l);
    });
    this.swipeCtrl.addLayer(missingLayers);
  }
}
