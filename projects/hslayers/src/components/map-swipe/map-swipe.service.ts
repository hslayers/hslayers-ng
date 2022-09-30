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
class HsMapSwipeParams {
  swipeCtrl: SwipeControl;
  rightLayers: LayerListItem[] = [];
  leftLayers: LayerListItem[] = [];
  entireMapLayers: LayerListItem[] = [];
  movingSide = SwipeSide.Left;
  wasMoved: boolean;
  swipeControlActive: boolean;
  orientation: 'vertical' | 'horizontal';
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
    public hsShareUrlService: HsShareUrlService,
    public hsLayoutService: HsLayoutService,
    private zone: NgZone
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
      if (this.hsLayoutService.panelEnabled('mapSwipe', app)) {
        this.initSwipeControl(app);
      }
    });
    this.hsEventBusService.layerManagerUpdates.pipe(first()).subscribe(() => {
      if (this.hsLayoutService.panelEnabled('mapSwipe', app)) {
        this.setInitialSwipeLayers(app);
      }
    });
    this.hsEventBusService.layerManagerUpdates.subscribe(({layer, app}) => {
      if (this.hsLayoutService.panelEnabled('mapSwipe', app)) {
        this.fillSwipeLayers(layer, app);
      }
    });
  }

  /**
   * Set initial map-swipe control state
   * @param app - App identifier
   */
  setInitCtrlActive(app: string): void {
    const appRef = this.get(app);
    const param = this.hsShareUrlService.getParamValue('map-swipe');
    if (param) {
      switch (param) {
        case 'enabled':
          appRef.swipeControlActive = true;
          break;
        default:
          appRef.swipeControlActive = false;
          break;
      }
    } else {
      appRef.swipeControlActive =
        this.hsConfig?.get(app).componentsEnabled?.mapSwipe ?? false;
    }
    this.updateUrlParam(app);
  }

  /**
   * Set initial orientation value
   * @param app - App identifier
   */
  setInitOri(app: string): void {
    const appRef = this.get(app);
    const storageOri = localStorage.getItem(`${app}:hs_map_swipe_ori`) as
      | 'vertical'
      | 'horizontal';
    if (storageOri) {
      appRef.orientation = storageOri;
    } else {
      appRef.orientation =
        this.hsConfig?.get(app).mapSwipeOptions?.orientation ?? 'vertical';
    }
    if (appRef.orientation !== 'vertical') {
      appRef.orientationVertical = false;
    }
    this.updateStorageOri(app);
  }
  /**
   * Initializes swipe control add adds it to the map
   * @param app - App identifier
   */
  initSwipeControl(app: string): void {
    const appRef = this.get(app);

    this.zone.runOutsideAngular(() => {
      appRef.swipeCtrl = new SwipeControl({
        orientation: appRef.orientation,
        app: app,
      });
    });

    if (appRef.swipeControlActive) {
      appRef.swipeCtrl.setTargetMap(this.hsMapService.getMap(app));
      this.hsMapService.getMap(app).addControl(appRef.swipeCtrl);
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
    const appRef = this.get(app);
    if (appRef == undefined) {
      return false;
    }
    return (
      appRef.swipeCtrl?.leftLayers?.length > 0 ||
      appRef.swipeCtrl?.rightLayers?.length > 0 ||
      appRef.entireMapLayers?.length > 0
    );
  }

  /**
   * Set swipe control orientation
   * @param app - App identifier
   */
  setOrientation(app: string): void {
    const appRef = this.get(app);
    appRef.orientationVertical = !appRef.orientationVertical;
    appRef.orientation = appRef.orientationVertical ? 'vertical' : 'horizontal';
    appRef.swipeCtrl.set('orientation', appRef.orientation);
    this.updateStorageOri(app);
  }
  /**
   * Fill swipe control layers
   * @param layer - layer issued from layerManagerUpdates event
   * @param app - App identifier
   */
  fillSwipeLayers(layer: Layer<Source> | void, app: string): void {
    const appRef = this.get(app);
    this.hsLayerShiftingService.fillLayers(app);
    if (!layer) {
      return;
    }
    const layerFound = this.hsLayerShiftingService
      .get(app)
      .layersCopy.find((wrapper) => wrapper.layer == layer);
    if (layerFound !== undefined) {
      this.setLayerActive(layerFound, app);
      appRef.wasMoved
        ? this.moveSwipeLayer(layerFound, app)
        : this.addSwipeLayer(layerFound, app);
      this.checkForMissingLayers(app);
    } else {
      this.removeCompletely(layer, app);
    }
    this.sortLayers(app);
    appRef.wasMoved = false;
    appRef.movingSide = SwipeSide.Left;
  }

  /**
   * Move a layer to swipe control
   * @param layerItem - layer issued from layerManagerUpdates event
   * @param app - App identifier
   */
  addSwipeLayer(layerItem: LayerListItem, app: string): void {
    const appRef = this.get(app);
    if (!appRef.swipeCtrl) {
      this.initSwipeControl(app);
    }
    this.createQueryFilter(layerItem, app);
    if (!this.findLayer(layerItem.layer, app)?.l) {
      layerItem.visible = layerItem.layer.getVisible();
      if (getSwipeSide(layerItem.layer) === 'right') {
        appRef.swipeCtrl.addLayer(layerItem, true);
        appRef.rightLayers.push(layerItem);
      } else if (getSwipeSide(layerItem.layer) === 'left') {
        appRef.swipeCtrl.addLayer(layerItem);
        appRef.leftLayers.push(layerItem);
      } else {
        appRef.entireMapLayers.push(layerItem);
      }
      layerItem.layer.on('change:visible', (e) =>
        this.layerVisibilityChanged(e, app)
      );
    }
  }

  /**
   * Crate queryFilter callback function for layer and set it as layer's property
   * Query will work for the layer, if the user's click was made on the same map swipe panel
   * where the layer is being rendered
   * If the layer swipe side is not specified, query will work by default
   * @param layerItem - layer issued from layerManagerUpdates event
   * @param app - App identifier
   */
  createQueryFilter(layerItem: LayerListItem, app: string): void {
    const appRef = this.get(app);
    const existingFilter = getQueryFilter(layerItem.layer);
    const filter = (map: Map, layer: Layer, pixel: number[]) => {
      let swipeFilter: boolean;
      const swipeSide: 'left' | 'right' = getSwipeSide(layer);
      if (!appRef.swipeControlActive || !swipeSide) {
        swipeFilter = true;
      } else {
        const clickPos =
          appRef.orientation == 'vertical'
            ? appRef.swipeCtrl.getPosValue(map.getSize()[0], pixel[0])
            : appRef.swipeCtrl.getPosValue(map.getSize()[1], pixel[1]);

        if (
          (clickPos <= appRef.swipeCtrl.get('position') &&
            swipeSide == 'left') ||
          (clickPos > appRef.swipeCtrl.get('position') && swipeSide == 'right')
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
   * @param app - App identifier
   */
  moveSwipeLayer(lyrListItem: LayerListItem, app: string): void {
    const appRef = this.get(app);
    if (appRef.movingSide === SwipeSide.Right) {
      this.moveRight(lyrListItem, app);
      setSwipeSide(lyrListItem.layer, 'right');
    }
    if (appRef.movingSide === SwipeSide.Left) {
      this.moveLeft(lyrListItem, app);
      setSwipeSide(lyrListItem.layer, 'left');
    }
    if (appRef.movingSide === SwipeSide.Full) {
      setSwipeSide(lyrListItem.layer, undefined);
      appRef.swipeCtrl.removeCompletely(lyrListItem.layer);
    }
  }
  /**
   * Move a layer to swipe control right side
   * @param layer - layer issued from layerManagerUpdates event
   * @param app - App identifier
   */
  moveRight(layer: LayerListItem, app: string): void {
    const appRef = this.get(app);
    appRef.swipeCtrl.removeLayer(layer);
    appRef.swipeCtrl.addLayer(layer, true);
  }
  /**
   * Move a layer to swipe control left side
   * @param layer - layer issued from layerManagerUpdates event
   * @param app - App identifier
   */
  moveLeft(layer: LayerListItem, app: string): void {
    const appRef = this.get(app);
    appRef.swipeCtrl.removeLayer(layer, true);
    appRef.swipeCtrl.addLayer(layer);
  }

  /**
   * Set map swipe control status enabled/disabled
   * @param app - App identifier
   */
  setControl(app: string): void {
    const appRef = this.get(app);
    appRef.swipeControlActive = !appRef.swipeControlActive;
    this.updateUrlParam(app);
    if (!this.hsMapService.getMap(app)) {
      return;
    }
    if (appRef.swipeControlActive) {
      appRef.swipeCtrl.setTargetMap(this.hsMapService.getMap(app));
      this.hsMapService.getMap(app).addControl(appRef.swipeCtrl);
      appRef.swipeCtrl.setEvents(true);
    } else {
      this.hsMapService.getMap(app).removeControl(appRef.swipeCtrl);
      appRef.swipeCtrl.setEvents();
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
    const appRef = this.get(app);
    const layerFound = this.findLayer(layerToRm, app);
    if (layerFound.l) {
      if (layerFound.arr === 'layers') {
        appRef.leftLayers = appRef.leftLayers.filter(
          (l) => l.layer != layerToRm
        );
      }
      if (layerFound.arr === 'rightLayers') {
        appRef.rightLayers = appRef.rightLayers.filter(
          (l) => l.layer != layerToRm
        );
      }
      if (layerFound.arr === 'entireMapLayers') {
        appRef.entireMapLayers = appRef.entireMapLayers.filter(
          (l) => l.layer != layerToRm
        );
      }
    }
    appRef.swipeCtrl.removeCompletely(layerToRm);
  }
  /**
   * Set layer as active (last dragged)
   * @param layer - layer issued from layerManagerUpdates event
   * @param app - App identifier
   */
  setLayerActive(layer: LayerListItem, app: string): void {
    const appRef = this.get(app);
    const layerFound = this.findLayer(layer.layer, app);
    appRef.leftLayers.forEach((l) => (l.active = false));
    appRef.rightLayers.forEach((l) => (l.active = false));
    appRef.entireMapLayers.forEach((l) => (l.active = false));
    if (layerFound?.l) {
      layerFound.l.active = true;
    }
  }
  /**
   * Set and add initial swipe control layers
   * @param app - App identifier
   */
  setInitialSwipeLayers(app: string): void {
    const appRef = this.get(app);
    const layerShiftingappRef = this.hsLayerShiftingService.get(app);
    appRef.leftLayers = [];
    appRef.rightLayers = [];
    appRef.entireMapLayers = [];
    this.hsLayerShiftingService.fillLayers(app);
    if (!layerShiftingappRef.layersCopy) {
      return;
    }
    for (const layer of layerShiftingappRef.layersCopy) {
      this.addSwipeLayer(layer, app);
    }
    this.sortLayers(app);
  }
  /**
   * Check if any layer is left out from swipe control and add it
   * @param app - App identifier
   */
  checkForMissingLayers(app: string): void {
    const missingLayers = this.hsLayerShiftingService
      .get(app)
      .layersCopy.filter((l) => {
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
    const appRef = this.get(app);
    appRef.leftLayers = this.hsLayerManagerService.sortLayersByZ(
      appRef.leftLayers,
      app
    );
    appRef.rightLayers = this.hsLayerManagerService.sortLayersByZ(
      appRef.rightLayers,
      app
    );
    appRef.entireMapLayers = this.hsLayerManagerService.sortLayersByZ(
      appRef.entireMapLayers,
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
    const appRef = this.get(app);
    const found = {l: null, arr: ''};
    found.l = appRef.leftLayers.find((lyr) => lyr.layer == targetLayer);
    found.arr = 'layers';
    if (!found.l) {
      found.l = appRef.rightLayers.find((lyr) => lyr.layer == targetLayer);
      found.arr = 'rightLayers';
    }
    if (!found.l) {
      found.l = appRef.entireMapLayers.find((lyr) => lyr.layer == targetLayer);
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
