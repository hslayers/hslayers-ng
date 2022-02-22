import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {first} from 'rxjs';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerManagerService} from '../layermanager/layermanager.service';
import {HsLayerShiftingService} from '../../common/layer-shifting/layer-shifting.service';
import {HsMapService} from '../map/map.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsToastService} from '../layout/toast/toast.service';
import {LayerListItem} from './../../common/layer-shifting/layer-shifting.service';
import {SwipeControl} from './swipe-control/swipe.control.class';
import {getSwipeSide, setSwipeSide} from '../../common/layer-extensions';

export enum SwipeSide {
  Left = 'left',
  Right = 'right',
  Full = 'full',
}
@Injectable({
  providedIn: 'root',
})
export class HsMapSwipeService {
  apps: {[key: string]: {swipeCtrl: SwipeControl}} = {};
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
    public hsLayerManagerService: HsLayerManagerService,
    public hsShareUrlService: HsShareUrlService
  ) {}

  init(app: string) {
    this.setInitCtrlActive(app);
    this.setInitOri(app);
    this.hsMapService.loaded(app).then(() => {
      this.initSwipeControl(app);
    });
    this.hsEventBusService.layerManagerUpdates
      .pipe(first())
      .subscribe(() => this.setInitialSwipeLayers(app));
    this.hsEventBusService.layerManagerUpdates.subscribe(({layer, app}) => {
      this.fillSwipeLayers(layer, app);
    });
  }

  setInitCtrlActive(app: string): void {
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
        this.hsConfig?.get(app).componentsEnabled?.mapSwipe ?? false;
    }
    this.updateUrlParam(app);
  }

  setInitOri(app: string): void {
    const storageOri = localStorage.getItem('hs_map_swipe_ori');
    if (storageOri) {
      this.orientation = storageOri;
    } else {
      this.orientation =
        this.hsConfig?.get(app).mapSwipeOptions?.orientation ?? 'vertical';
    }
    if (this.orientation !== 'vertical') {
      this.orientationVertical = false;
    }
    this.updateStorageOri();
  }
  /**
   * Initializes swipe control add adds it to the map
   */
  initSwipeControl(app: string): void {
    this.apps[app] = {
      swipeCtrl: new SwipeControl({
        orientation: this.orientation,
      }),
    };
    if (this.swipeControlActive) {
      this.apps[app].swipeCtrl.setTargetMap(this.hsMapService.getMap(app));
      this.hsMapService.getMap(app).addControl(this.apps[app].swipeCtrl);
    }
  }

  updateStorageOri(): void {
    localStorage.setItem('hs_map_swipe_ori', this.orientation);
  }

  updateUrlParam(app: string): void {
    this.hsShareUrlService.updateCustomParams(
      {
        'map-swipe': this.swipeControlActive ? 'enabled' : 'disabled',
      },
      app
    );
  }

  /**
   * Check if any layers are added to the swipe control
   */
  layersAvailable(app: string): boolean {
    if (this.apps[app] == undefined) {
      return false;
    }
    return (
      this.apps[app].swipeCtrl?.layers?.length > 0 ||
      this.apps[app].swipeCtrl?.rightLayers?.length > 0 ||
      this.entireMapLayers?.length > 0
    );
  }

  /**
   * Set swipe control orientation
   */
  setOrientation(app: string): void {
    this.orientationVertical = !this.orientationVertical;
    this.orientation = this.orientationVertical ? 'vertical' : 'horizontal';
    this.apps[app].swipeCtrl.set('orientation', this.orientation);
    this.updateStorageOri();
  }
  /**
   * Fill swipe control layers
   * @param layer - layer issued from layerManagerUpdates event
   */
  fillSwipeLayers(layer: Layer<Source> | void, app: string): void {
    this.hsLayerShiftingService.fillLayers(app);
    if (!layer) {
      return;
    }
    const layerFound = this.hsLayerShiftingService.layersCopy.find(
      (wrapper) => wrapper.layer == layer
    );
    if (layerFound !== undefined) {
      this.setLayerActive(layerFound);
      this.wasMoved
        ? this.moveSwipeLayer(layerFound, app)
        : this.addSwipeLayer(layerFound, app);
      this.checkForMissingLayers(app);
    } else {
      this.removeCompletely(layer, app);
    }
    this.sortLayers(app);
    this.wasMoved = false;
    this.movingSide = SwipeSide.Left;
  }

  /**
   * Move a layer to swipe control
   * @param layer - layer issued from layerManagerUpdates event
   */
  addSwipeLayer(layerItem: LayerListItem, app: string): void {
    if (!this.findLayer(layerItem.layer)?.l) {
      layerItem.visible = layerItem.layer.getVisible();
      if (getSwipeSide(layerItem.layer) === 'right') {
        this.apps[app].swipeCtrl.addLayer(layerItem, true);
        this.rightLayers.push(layerItem);
      } else if (getSwipeSide(layerItem.layer) === 'left') {
        this.apps[app].swipeCtrl.addLayer(layerItem);
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
  moveSwipeLayer(lyrListItem: LayerListItem, app: string): void {
    if (this.movingSide === SwipeSide.Right) {
      this.moveRight(lyrListItem, app);
      setSwipeSide(lyrListItem.layer, 'right');
    }
    if (this.movingSide === SwipeSide.Left) {
      this.moveLeft(lyrListItem, app);
      setSwipeSide(lyrListItem.layer, 'left');
    }
    if (this.movingSide === SwipeSide.Full) {
      setSwipeSide(lyrListItem.layer, undefined);
      this.apps[app].swipeCtrl.removeCompletely(lyrListItem.layer);
    }
  }
  /**
   * Move a layer to swipe control right side
   * @param layer - layer issued from layerManagerUpdates event
   */
  moveRight(layer: LayerListItem, app: string): void {
    this.apps[app].swipeCtrl.removeLayer(layer);
    this.apps[app].swipeCtrl.addLayer(layer, true);
  }
  /**
   * Move a layer to swipe control left side
   * @param layer - layer issued from layerManagerUpdates event
   */
  moveLeft(layer: LayerListItem, app: string): void {
    this.apps[app].swipeCtrl.removeLayer(layer, true);
    this.apps[app].swipeCtrl.addLayer(layer);
  }

  /**
   * Set map swipe control status enabled/disabled
   */
  setControl(app: string): void {
    this.swipeControlActive = !this.swipeControlActive;
    this.updateUrlParam(app);
    if (!this.hsMapService.getMap(app)) {
      return;
    }
    if (this.swipeControlActive) {
      this.apps[app].swipeCtrl.setTargetMap(this.hsMapService.getMap(app));
      this.hsMapService.getMap(app).addControl(this.apps[app].swipeCtrl);
      this.apps[app].swipeCtrl.setEvents(true);
    } else {
      this.hsMapService.getMap(app).removeControl(this.apps[app].swipeCtrl);
      this.apps[app].swipeCtrl.setEvents();
    }
    try {
      this.hsMapService.getMap(app).renderSync();
    } catch (e) {
      console.error(e);
    }
  }
  /**
   * Remove layer completely
   * @param layer - layer issued from layerManagerUpdates event
   */
  removeCompletely(layerToRm: Layer<Source>, app: string): void {
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
    this.apps[app].swipeCtrl.removeCompletely(layerToRm);
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
  setInitialSwipeLayers(app: string): void {
    this.layers = [];
    this.rightLayers = [];
    this.entireMapLayers = [];
    this.hsLayerShiftingService.fillLayers(app);
    if (!this.hsLayerShiftingService.layersCopy) {
      return;
    }
    for (const layer of this.hsLayerShiftingService.layersCopy) {
      this.addSwipeLayer(layer, app);
    }
    this.sortLayers(app);
  }
  /**
   * Check if any layer is left out from swipe control and add it
   */
  checkForMissingLayers(app: string): void {
    const missingLayers = this.hsLayerShiftingService.layersCopy.filter((l) => {
      return !this.findLayer(l.layer)?.l;
    });
    for (const layer of missingLayers) {
      this.addSwipeLayer(layer, app);
    }
    this.sortLayers(app);
  }

  /**
   * Sort layers to resemple layer order by ZIndex on the map
   */
  sortLayers(app: string): void {
    this.layers = this.hsLayerManagerService.sortLayersByZ(this.layers, app);
    this.rightLayers = this.hsLayerManagerService.sortLayersByZ(
      this.rightLayers,
      app
    );
    this.entireMapLayers = this.hsLayerManagerService.sortLayersByZ(
      this.entireMapLayers,
      app
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
