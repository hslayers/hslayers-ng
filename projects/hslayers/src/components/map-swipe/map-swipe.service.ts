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
class HsMapSwipeParams {
  swipeCtrl: SwipeControl;
  rightLayers: LayerListItem[] = [];
  leftLayers: LayerListItem[] = [];
  entireMapLayers: LayerListItem[] = [];
  movingSide = SwipeSide.Left;
  wasMoved: boolean;
  swipeControlActive: boolean;
  orientation: string;
  orientationVertical = true;
}
@Injectable({
  providedIn: 'root',
})
export class HsMapSwipeService {
  apps: {
    [id: string]: HsMapSwipeParams;
  } = {default: new HsMapSwipeParams()};
  constructor(
    public hsMapService: HsMapService,
    public hsConfig: HsConfig,
    public hsToastService: HsToastService,
    public hsLayerShiftingService: HsLayerShiftingService,
    public hsEventBusService: HsEventBusService,
    public hsLayerManagerService: HsLayerManagerService,
    public hsShareUrlService: HsShareUrlService
  ) {}

  /**
   * Initialize the map swipe service data and subscribers
   * @param app - App identifier
   */
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

  /**
   * Set initial map-swipe control state
   * @param app - App identifier
   */
  setInitCtrlActive(app: string): void {
    const param = this.hsShareUrlService.getParamValue('map-swipe');
    if (param) {
      switch (param) {
        case 'enabled':
          this.get(app).swipeControlActive = true;
          break;
        default:
          this.get(app).swipeControlActive = false;
          break;
      }
    } else {
      this.get(app).swipeControlActive =
        this.hsConfig?.get(app).componentsEnabled?.mapSwipe ?? false;
    }
    this.updateUrlParam(app);
  }

  /**
   * Set initial orientation value
   * @param app - App identifier
   */
  setInitOri(app: string): void {
    const storageOri = localStorage.getItem(`${app}:hs_map_swipe_ori`);
    if (storageOri) {
      this.get(app).orientation = storageOri;
    } else {
      this.get(app).orientation =
        this.hsConfig?.get(app).mapSwipeOptions?.orientation ?? 'vertical';
    }
    if (this.get(app).orientation !== 'vertical') {
      this.get(app).orientationVertical = false;
    }
    this.updateStorageOri(app);
  }
  /**
   * Initializes swipe control add adds it to the map
   * @param app - App identifier
   */
  initSwipeControl(app: string): void {
    this.get(app).swipeCtrl = new SwipeControl({
      orientation: this.get(app).orientation,
      app: app,
    });
    if (this.get(app).swipeControlActive) {
      this.get(app).swipeCtrl.setTargetMap(this.hsMapService.getMap(app));
      this.hsMapService.getMap(app).addControl(this.get(app).swipeCtrl);
    }
  }

  /**
   * Update local storage orientation value
   * @param app - App identifier
   */
  updateStorageOri(app: string): void {
    localStorage.setItem(`${app}:hs_map_swipe_ori`, this.get(app).orientation);
  }

  /**
   * Update url params to include map swipe state
   * @param app - App identifier
   */
  updateUrlParam(app: string): void {
    this.hsShareUrlService.updateCustomParams(
      {
        'map-swipe': this.get(app).swipeControlActive ? 'enabled' : 'disabled',
      },
      app
    );
  }

  /**
   * Check if any layers are added to the swipe control
   * @param app - App identifier
   */
  layersAvailable(app: string): boolean {
    if (this.get(app) == undefined) {
      return false;
    }
    return (
      this.get(app).swipeCtrl?.leftLayers?.length > 0 ||
      this.get(app).swipeCtrl?.rightLayers?.length > 0 ||
      this.get(app).entireMapLayers?.length > 0
    );
  }

  /**
   * Set swipe control orientation
   * @param app - App identifier
   */
  setOrientation(app: string): void {
    this.get(app).orientationVertical = !this.get(app).orientationVertical;
    this.get(app).orientation = this.get(app).orientationVertical
      ? 'vertical'
      : 'horizontal';
    this.get(app).swipeCtrl.set('orientation', this.get(app).orientation);
    this.updateStorageOri(app);
  }
  /**
   * Fill swipe control layers
   * @param layer - layer issued from layerManagerUpdates event
   * @param app - App identifier
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
      this.get(app).wasMoved
        ? this.moveSwipeLayer(layerFound, app)
        : this.addSwipeLayer(layerFound, app);
      this.checkForMissingLayers(app);
    } else {
      this.removeCompletely(layer, app);
    }
    this.sortLayers(app);
    this.get(app).wasMoved = false;
    this.get(app).movingSide = SwipeSide.Left;
  }

  /**
   * Move a layer to swipe control
   * @param layerItem - layer issued from layerManagerUpdates event
   * @param app - App identifier
   */
  addSwipeLayer(layerItem: LayerListItem, app: string): void {
    if (!this.get(app).swipeCtrl) {
      this.initSwipeControl(app);
    }
    if (!this.findLayer(layerItem.layer, app)?.l) {
      layerItem.visible = layerItem.layer.getVisible();
      if (getSwipeSide(layerItem.layer) === 'right') {
        this.get(app).swipeCtrl.addLayer(layerItem, true);
        this.get(app).rightLayers.push(layerItem);
      } else if (getSwipeSide(layerItem.layer) === 'left') {
        this.get(app).swipeCtrl.addLayer(layerItem);
        this.get(app).leftLayers.push(layerItem);
      } else {
        this.get(app).entireMapLayers.push(layerItem);
      }
      layerItem.layer.on('change:visible', (e) =>
        this.layerVisibilityChanged(e, app)
      );
    }
  }
  /**
   * Move a layer to swipe control
   * @param lyrListItem - layer issued from layerManagerUpdates event
   * @param app - App identifier
   */
  moveSwipeLayer(lyrListItem: LayerListItem, app: string): void {
    if (this.get(app).movingSide === SwipeSide.Right) {
      this.moveRight(lyrListItem, app);
      setSwipeSide(lyrListItem.layer, 'right');
    }
    if (this.get(app).movingSide === SwipeSide.Left) {
      this.moveLeft(lyrListItem, app);
      setSwipeSide(lyrListItem.layer, 'left');
    }
    if (this.get(app).movingSide === SwipeSide.Full) {
      setSwipeSide(lyrListItem.layer, undefined);
      this.get(app).swipeCtrl.removeCompletely(lyrListItem.layer);
    }
  }
  /**
   * Move a layer to swipe control right side
   * @param layer - layer issued from layerManagerUpdates event
   * @param app - App identifier
   */
  moveRight(layer: LayerListItem, app: string): void {
    this.get(app).swipeCtrl.removeLayer(layer);
    this.get(app).swipeCtrl.addLayer(layer, true);
  }
  /**
   * Move a layer to swipe control left side
   * @param layer - layer issued from layerManagerUpdates event
   * @param app - App identifier
   */
  moveLeft(layer: LayerListItem, app: string): void {
    this.get(app).swipeCtrl.removeLayer(layer, true);
    this.get(app).swipeCtrl.addLayer(layer);
  }

  /**
   * Set map swipe control status enabled/disabled
   * @param app - App identifier
   */
  setControl(app: string): void {
    this.get(app).swipeControlActive = !this.get(app).swipeControlActive;
    this.updateUrlParam(app);
    if (!this.hsMapService.getMap(app)) {
      return;
    }
    if (this.get(app).swipeControlActive) {
      this.get(app).swipeCtrl.setTargetMap(this.hsMapService.getMap(app));
      this.hsMapService.getMap(app).addControl(this.get(app).swipeCtrl);
      this.get(app).swipeCtrl.setEvents(true);
    } else {
      this.hsMapService.getMap(app).removeControl(this.get(app).swipeCtrl);
      this.get(app).swipeCtrl.setEvents();
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
   * @param app - App identifier
   */
  removeCompletely(layerToRm: Layer<Source>, app: string): void {
    const layerFound = this.findLayer(layerToRm, app);
    if (layerFound.l) {
      if (layerFound.arr === 'layers') {
        this.get(app).leftLayers = this.get(app).leftLayers.filter(
          (l) => l.layer != layerToRm
        );
      }
      if (layerFound.arr === 'rightLayers') {
        this.get(app).rightLayers = this.get(app).rightLayers.filter(
          (l) => l.layer != layerToRm
        );
      }
      if (layerFound.arr === 'entireMapLayers') {
        this.get(app).entireMapLayers = this.get(app).entireMapLayers.filter(
          (l) => l.layer != layerToRm
        );
      }
    }
    this.get(app).swipeCtrl.removeCompletely(layerToRm);
  }
  /**
   * Set layer as active (last dragged)
   * @param layer - layer issued from layerManagerUpdates event
   * @param app - App identifier
   */
  setLayerActive(layer: LayerListItem, app: string): void {
    const layerFound = this.findLayer(layer.layer, app);
    this.get(app).leftLayers.forEach((l) => (l.active = false));
    this.get(app).rightLayers.forEach((l) => (l.active = false));
    this.get(app).entireMapLayers.forEach((l) => (l.active = false));
    if (layerFound?.l) {
      layerFound.l.active = true;
    }
  }
  /**
   * Set and add initial swipe control layers
   * @param app - App identifier
   */
  setInitialSwipeLayers(app: string): void {
    this.get(app).leftLayers = [];
    this.get(app).rightLayers = [];
    this.get(app).entireMapLayers = [];
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
   * @param app - App identifier
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
   * @param app - App identifier
   */
  sortLayers(app: string): void {
    this.get(app).leftLayers = this.hsLayerManagerService.sortLayersByZ(
      this.get(app).leftLayers,
      app
    );
    this.get(app).rightLayers = this.hsLayerManagerService.sortLayersByZ(
      this.get(app).rightLayers,
      app
    );
    this.get(app).entireMapLayers = this.hsLayerManagerService.sortLayersByZ(
      this.get(app).entireMapLayers,
      app
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
   * @param app - App identifier
   */
  layerVisibilityChanged(e, app: string): void {
    const found = this.findLayer(e.target, app);
    if (found.l) {
      found.l.visible = e.target.getVisible();
    }
  }

  /**
   * Find layer based on layer source
   * @param targetLayer - Layer to be found
   * @param app - App identifier
   */
  findLayer(
    targetLayer: Layer<Source>,
    app: string
  ): {l: LayerListItem; arr: string} {
    const found = {l: null, arr: ''};
    found.l = this.get(app).leftLayers.find((lyr) => lyr.layer == targetLayer);
    found.arr = 'layers';
    if (!found.l) {
      found.l = this.get(app).rightLayers.find(
        (lyr) => lyr.layer == targetLayer
      );
      found.arr = 'rightLayers';
    }
    if (!found.l) {
      found.l = this.get(app).entireMapLayers.find(
        (lyr) => lyr.layer == targetLayer
      );
      found.arr = 'entireMapLayers';
    }
    return found;
  }

  /**
   * Get the params saved by the map swipe service for the current app
   * @param app - App identifier
   */
  get(app: string): HsMapSwipeParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsMapSwipeParams();
    }
    return this.apps[app ?? 'default'];
  }
}
