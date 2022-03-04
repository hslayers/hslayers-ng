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
  apps: {
    [key: string]: {
      swipeCtrl: SwipeControl;
      rightLayers: LayerListItem[];
      leftLayers: LayerListItem[];
      entireMapLayers: LayerListItem[];
      movingSide: string;
      wasMoved: boolean;
      swipeControlActive: boolean;
      orientation: string;
      orientationVertical: boolean;
    };
  } = {};
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
    this.apps[app] = {
      swipeCtrl: null,
      rightLayers: [],
      leftLayers: [],
      entireMapLayers: [],
      movingSide: SwipeSide.Left,
      orientationVertical: true,
      wasMoved: null,
      swipeControlActive: null,
      orientation: null,
    };
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
          this.apps[app].swipeControlActive = true;
          break;
        default:
          this.apps[app].swipeControlActive = false;
          break;
      }
    } else {
      this.apps[app].swipeControlActive =
        this.hsConfig?.get(app).componentsEnabled?.mapSwipe ?? false;
    }
    this.updateUrlParam(app);
  }

  setInitOri(app: string): void {
    const storageOri = localStorage.getItem(`${app}:hs_map_swipe_ori`);
    if (storageOri) {
      this.apps[app].orientation = storageOri;
    } else {
      this.apps[app].orientation =
        this.hsConfig?.get(app).mapSwipeOptions?.orientation ?? 'vertical';
    }
    if (this.apps[app].orientation !== 'vertical') {
      this.apps[app].orientationVertical = false;
    }
    this.updateStorageOri(app);
  }
  /**
   * Initializes swipe control add adds it to the map
   */
  initSwipeControl(app: string): void {
    this.apps[app].swipeCtrl = new SwipeControl({
      orientation: this.apps[app].orientation,
      app: app,
    });
    if (this.apps[app].swipeControlActive) {
      this.apps[app].swipeCtrl.setTargetMap(this.hsMapService.getMap(app));
      this.hsMapService.getMap(app).addControl(this.apps[app].swipeCtrl);
    }
  }

  updateStorageOri(app: string): void {
    localStorage.setItem(`${app}:hs_map_swipe_ori`, this.apps[app].orientation);
  }

  updateUrlParam(app: string): void {
    this.hsShareUrlService.updateCustomParams(
      {
        'map-swipe': this.apps[app].swipeControlActive ? 'enabled' : 'disabled',
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
      this.apps[app].swipeCtrl?.leftLayers?.length > 0 ||
      this.apps[app].swipeCtrl?.rightLayers?.length > 0 ||
      this.apps[app].entireMapLayers?.length > 0
    );
  }

  /**
   * Set swipe control orientation
   */
  setOrientation(app: string): void {
    this.apps[app].orientationVertical = !this.apps[app].orientationVertical;
    this.apps[app].orientation = this.apps[app].orientationVertical
      ? 'vertical'
      : 'horizontal';
    this.apps[app].swipeCtrl.set('orientation', this.apps[app].orientation);
    this.updateStorageOri(app);
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
      this.setLayerActive(layerFound, app);
      this.apps[app].wasMoved
        ? this.moveSwipeLayer(layerFound, app)
        : this.addSwipeLayer(layerFound, app);
      this.checkForMissingLayers(app);
    } else {
      this.removeCompletely(layer, app);
    }
    this.sortLayers(app);
    this.apps[app].wasMoved = false;
    this.apps[app].movingSide = SwipeSide.Left;
  }

  /**
   * Move a layer to swipe control
   * @param layer - layer issued from layerManagerUpdates event
   */
  addSwipeLayer(layerItem: LayerListItem, app: string): void {
    if (!this.findLayer(layerItem.layer, app)?.l) {
      layerItem.visible = layerItem.layer.getVisible();
      if (getSwipeSide(layerItem.layer) === 'right') {
        this.apps[app].swipeCtrl.addLayer(layerItem, true);
        this.apps[app].rightLayers.push(layerItem);
      } else if (getSwipeSide(layerItem.layer) === 'left') {
        this.apps[app].swipeCtrl.addLayer(layerItem);
        this.apps[app].leftLayers.push(layerItem);
      } else {
        this.apps[app].entireMapLayers.push(layerItem);
      }
      layerItem.layer.on('change:visible', (e) =>
        this.layerVisibilityChanged(e, app)
      );
    }
  }
  /**
   * Move a layer to swipe control
   * @param layer - layer issued from layerManagerUpdates event
   */
  moveSwipeLayer(lyrListItem: LayerListItem, app: string): void {
    if (this.apps[app].movingSide === SwipeSide.Right) {
      this.moveRight(lyrListItem, app);
      setSwipeSide(lyrListItem.layer, 'right');
    }
    if (this.apps[app].movingSide === SwipeSide.Left) {
      this.moveLeft(lyrListItem, app);
      setSwipeSide(lyrListItem.layer, 'left');
    }
    if (this.apps[app].movingSide === SwipeSide.Full) {
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
    this.apps[app].swipeControlActive = !this.apps[app].swipeControlActive;
    this.updateUrlParam(app);
    if (!this.hsMapService.getMap(app)) {
      return;
    }
    if (this.apps[app].swipeControlActive) {
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
    const layerFound = this.findLayer(layerToRm, app);
    if (layerFound.l) {
      if (layerFound.arr === 'layers') {
        this.apps[app].leftLayers = this.apps[app].leftLayers.filter(
          (l) => l.layer != layerToRm
        );
      }
      if (layerFound.arr === 'rightLayers') {
        this.apps[app].rightLayers = this.apps[app].rightLayers.filter(
          (l) => l.layer != layerToRm
        );
      }
      if (layerFound.arr === 'entireMapLayers') {
        this.apps[app].entireMapLayers = this.apps[app].entireMapLayers.filter(
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
  setLayerActive(layer: LayerListItem, app: string): void {
    const layerFound = this.findLayer(layer.layer, app);
    this.apps[app].leftLayers.forEach((l) => (l.active = false));
    this.apps[app].rightLayers.forEach((l) => (l.active = false));
    this.apps[app].entireMapLayers.forEach((l) => (l.active = false));
    if (layerFound?.l) {
      layerFound.l.active = true;
    }
  }
  /**
   * Set and add initial swipe control layers
   */
  setInitialSwipeLayers(app: string): void {
    this.apps[app].leftLayers = [];
    this.apps[app].rightLayers = [];
    this.apps[app].entireMapLayers = [];
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
      return !this.findLayer(l.layer, app)?.l;
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
    this.apps[app].leftLayers = this.hsLayerManagerService.sortLayersByZ(
      this.apps[app].leftLayers,
      app
    );
    this.apps[app].rightLayers = this.hsLayerManagerService.sortLayersByZ(
      this.apps[app].rightLayers,
      app
    );
    this.apps[app].entireMapLayers = this.hsLayerManagerService.sortLayersByZ(
      this.apps[app].entireMapLayers,
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
  layerVisibilityChanged(e, app: string): void {
    const found = this.findLayer(e.target, app);
    if (found.l) {
      found.l.visible = e.target.getVisible();
    }
  }

  /**
   * Find layer based on layer source
   */
  findLayer(
    targetLayer: Layer<Source>,
    app: string
  ): {l: LayerListItem; arr: string} {
    const found = {l: null, arr: ''};
    found.l = this.apps[app].leftLayers.find((lyr) => lyr.layer == targetLayer);
    found.arr = 'layers';
    if (!found.l) {
      found.l = this.apps[app].rightLayers.find(
        (lyr) => lyr.layer == targetLayer
      );
      found.arr = 'rightLayers';
    }
    if (!found.l) {
      found.l = this.apps[app].entireMapLayers.find(
        (lyr) => lyr.layer == targetLayer
      );
      found.arr = 'entireMapLayers';
    }
    return found;
  }
}
