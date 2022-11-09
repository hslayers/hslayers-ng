import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsEventBusService} from '../../components/core/event-bus.service';
import {HsLayerManagerService} from '../../components/layermanager/layermanager.service';
import {HsMapService} from '../../components/map/map.service';
import {HsUtilsService} from '../../components/utils/utils.service';
import {getBase} from '../layer-extensions';

export class LayerListItem {
  title: string;
  layer: Layer<Source>;
  active?: boolean;
  visible?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HsLayerShiftingService {
  apps: {
    [key: string]: {
      layersCopy: LayerListItem[];
    };
  } = {
    default: {layersCopy: []},
  };

  constructor(
    public hsMapService: HsMapService,
    public hsLayerManagerService: HsLayerManagerService,
    public hsUtilsService: HsUtilsService,
    public hsEventBusService: HsEventBusService
  ) {}

  /**
   * Get the params saved by the layer shifting service for the current app
   * @param app - App identifier
   */
  get(app: string): {
    layersCopy: LayerListItem[];
  } {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = {
        layersCopy: [],
      };
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * Function by which to filter the displayed layers.
   * Usually just by showInLayermanager property.
   * @param app - App identifier
   */
  private layerFilter(app: string) {
    return this.hsLayerManagerService
      .get(app)
      .data.layers.filter((l) => l.showInLayerManager ?? true);
  }

  /**
   * Get map layers
   * @param app - App identifier
   */
  private getMapLayers(app: string): Layer<Source>[] {
    return this.hsMapService
      .getLayersArray(app)
      .filter((layer: Layer<Source>) => getBase(layer) !== true);
  }

  /**
   * Copies layers from Layermanager layer list for the physical layer list
   * @param app - App identifier
   */
  fillLayers(app: string): void {
    if (!this.layerFilter(app)) {
      return;
    }
    this.get(app).layersCopy = this.hsLayerManagerService.sortLayersByZ(
      this.layerFilter(app).map((l) => {
        return {title: l.title, layer: l.layer};
      }),
      app
    );
  }

  /**
   * Move the provided layer in the middle between all other rendered layers on the map
   * @param layer - provided layer
   * @param target - Target layer number, item or source
   * @param app - App identifier
   */

  moveTo(
    layer: LayerListItem | Layer<Source>,
    target: number | LayerListItem | Layer<Source>,
    app: string
  ): void {
    if (this.hsUtilsService.instOf(target, LayerListItem)) {
      //Wrapped layer provided
      target = (target as LayerListItem).layer.getZIndex();
    } else if (this.hsUtilsService.instOf(target, Layer)) {
      //OL layer provided
      target = (target as Layer<Source>).getZIndex();
    }
    this.moveAndShift(this.getOlLayer(layer), target as number, app);
  }
  /**
   * Move and shift layer order to make changes on the map
   * @param providedLayer - provided layer
   * @param preferredZIndex - ZIndex value to switch to
   * @param app - App identifier
   */
  private moveAndShift(
    providedLayer: Layer<Source>,
    preferredZIndex: number,
    app: string
  ): void {
    if (providedLayer === undefined) {
      return;
    }
    if (providedLayer.getZIndex() != preferredZIndex) {
      const indexFrom = providedLayer.getZIndex();
      const indexTo = preferredZIndex;
      const incrementValue = indexTo > indexFrom ? -1 : 1;
      for (const lyr of this.getMapLayers(app).filter(
        (lyr) => lyr != providedLayer
      )) {
        const currentZIndex = lyr.getZIndex();
        if (
          (currentZIndex >= indexFrom && currentZIndex <= indexTo) ||
          (currentZIndex <= indexFrom && currentZIndex >= indexTo)
        ) {
          lyr.setZIndex(lyr.getZIndex() + incrementValue);
        }
      }
      providedLayer.setZIndex(preferredZIndex);
      this.hsEventBusService.layerManagerUpdates.next({
        layer: providedLayer,
        app,
      });
    }
  }

  /**
   * Gets layer property of container object or the actual provided ol layer
   * @param layer - Provided layer
   * @returns Returns ol layer
   */
  private getOlLayer(
    providedLayer: LayerListItem | Layer<Source>
  ): Layer<Source> {
    if (this.hsUtilsService.instOf(providedLayer, Layer)) {
      return providedLayer as Layer<Source>;
    } else {
      return (providedLayer as LayerListItem).layer;
    }
  }

  /**
   * Gets all layer ZIndex values from the layer list
   * @param app - App identifier
   * @returns Returns array of ZIndex values
   */
  private zIndexList(app: string): number[] {
    return this.getMapLayers(app).map((lyr) => lyr.getZIndex() || 0);
  }
  /**
   * Gets maximum value from ZIndex value array
   * @param app - App identifier
   * @returns Returns max ZIndex value
   */
  getMaxZ(app: string): number {
    return Math.max(...this.zIndexList(app));
  }
  /**
   * Gets minimum value from ZIndex value array
   * @param app - App identifier
   * @returns Returns min ZIndex value
   */
  getMinZ(app: string): number {
    return Math.min(...this.zIndexList(app));
  }

  /**
   * Applies a new ZIndex value to the selected layer that is responsible for layer rendering on the map
   * @param indexTo - new ZIndex value for the selected layer
   * @param layer - Selected layer from physical layer list
   * @param app - App identifier
   */
  private setLayerZIndex(
    indexTo: number,
    layer: Layer<Source>,
    app: string
  ): void {
    const layerSwitchedWith = this.get(app).layersCopy[indexTo].layer;
    const interactedLayerZIndex = layer.getZIndex();
    layer.setZIndex(layerSwitchedWith.getZIndex());
    layerSwitchedWith.setZIndex(interactedLayerZIndex);
    this.hsEventBusService.layerManagerUpdates.next({layer, app});
  }
  /**
   * Move the provided layer under all other rendered layers on the map
   * @param layer - provided layer
   * @param app - App identifier
   */
  moveToBottom(layer: LayerListItem | Layer<Source>, app: string): void {
    this.moveAndShift(this.getOlLayer(layer), this.getMinZ(app), app);
  }
  /**
   * Move the provided layer over all other rendered layers on the map
   * @param layer - provided layer
   * @param app - App identifier
   */
  moveToTop(layer: LayerListItem | Layer<Source>, app: string): void {
    this.moveAndShift(this.getOlLayer(layer), this.getMaxZ(app), app);
  }

  /**
   * Changes selected layers ZIndex value - layer with the largest ZIndex will be rendered on top of all other layers
   * @param baseLayer - Selected layer from physical layer list
   * @param direction - Direction in which to move the selected layer - up/down
   * @param app - App identifier
   */
  swapSibling(baseLayer: LayerListItem, direction: string, app: string): void {
    const currentLayerIndex = this.get(app).layersCopy.indexOf(baseLayer);
    switch (direction.toLocaleLowerCase()) {
      case 'up':
        if (currentLayerIndex != 0) {
          this.setLayerZIndex(currentLayerIndex - 1, baseLayer.layer, app);
        }
        break;
      case 'down':
        if (currentLayerIndex < this.get(app).layersCopy.length - 1) {
          this.setLayerZIndex(currentLayerIndex + 1, baseLayer.layer, app);
        }
        break;
      default:
    }
  }
}
