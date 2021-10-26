import {HsConfig} from '../../../config.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerManagerService} from '../layermanager.service';
import {HsMapService} from '../../map/map.service';
import {HsUtilsService} from '../../utils/utils.service';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {getBase} from '../../../common/layer-extensions';

export class PhysicalListItem {
  title: string;
  layer: Layer<Source>;
  active?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HsLayermanagerPhysicalListService {
  layersCopy: PhysicalListItem[];
  constructor(
    public HsEventBusService: HsEventBusService,
    public HsLayerManagerService: HsLayerManagerService,
    public HsConfig: HsConfig,
    public HsMapService: HsMapService,
    private HsUtilsService: HsUtilsService
  ) {}

  private get logicalListLayers() {
    return this.HsLayerManagerService.data.layers;
  }

  private get mapLayers(): Layer<Source>[] {
    return this.HsMapService.getLayersArray().filter(
      (layer: Layer<Source>) => getBase(layer) != true
    );
  }

  /**
   * Copies layers from Layermanager layer list for the physical layer list
   */
  fillLayers(): void {
    if (this.logicalListLayers == undefined) {
      return;
    }
    this.layersCopy = this.HsLayerManagerService.sortLayersByZ(
      this.logicalListLayers.map((l) => {
        return {title: l.title, layer: l.layer};
      })
    );
  }
  /**
   * Changes selected layers ZIndex value - layer with the largest ZIndex will be rendered on top of all other layers
   * @param baseLayer Selected layer from physical layer list
   * @param direction Direction in which to move the selected layer - up/down
   */
  swapSibling(baseLayer: PhysicalListItem, direction: string): void {
    const currentLayerIndex = this.layersCopy.indexOf(baseLayer);
    switch (direction.toLocaleLowerCase()) {
      case 'up':
        if (currentLayerIndex != 0) {
          this.setLayerZIndex(currentLayerIndex - 1, baseLayer.layer);
        }
        break;
      case 'down':
        if (currentLayerIndex < this.layersCopy.length - 1) {
          this.setLayerZIndex(currentLayerIndex + 1, baseLayer.layer);
        }
        break;
      default:
    }
  }
  /**
   * Applies a new ZIndex value to the selected layer that is responsible for layer rendering on the map
   * @param indexTo new ZIndex value for the selected layer
   * @param layer Selected layer from physical layer list
   */
  private setLayerZIndex(indexTo: number, layer: Layer<Source>): void {
    const layerSwitchedWith = this.layersCopy[indexTo].layer;
    const interactedLayerZIndex = layer.getZIndex();
    layer.setZIndex(layerSwitchedWith.getZIndex());
    layerSwitchedWith.setZIndex(interactedLayerZIndex);
    this.HsEventBusService.layerManagerUpdates.next(layer);
  }
  /**
   * Move the provided layer under all other rendered layers on the map
   * @param layer provided layer
   */
  moveToBottom(layer: PhysicalListItem | Layer<Source>): void {
    this.moveAndShift(this.getOlLayer(layer), this.getMinZ());
  }
  /**
   * Move the provided layer over all other rendered layers on the map
   * @param layer provided layer
   */
  moveToTop(layer: PhysicalListItem | Layer<Source>): void {
    this.moveAndShift(this.getOlLayer(layer), this.getMaxZ());
  }
  /**
   * Move the provided layer in the middle between all other rendered layers on the map
   * @param layer provided layer
   */
  moveTo(
    layer: PhysicalListItem | Layer<Source>,
    target: number | PhysicalListItem | Layer<Source>
  ): void {
    if (this.HsUtilsService.instOf(target, PhysicalListItem)) {
      //Wrapped layer provided
      target = (target as PhysicalListItem).layer.getZIndex();
    } else if (this.HsUtilsService.instOf(target, Layer)) {
      //OL layer provided
      target = (target as Layer<Source>).getZIndex();
    }
    this.moveAndShift(this.getOlLayer(layer), target as number);
  }
  /**
   * Move and shift layer order to make changes on the map
   * @param providedLayer provided layer
   * @param preferredZIndex ZIndex value to switch to
   */
  private moveAndShift(
    providedLayer: Layer<Source>,
    preferredZIndex: number
  ): void {
    if (providedLayer === undefined) {
      return;
    }
    if (providedLayer.getZIndex() != preferredZIndex) {
      const indexFrom = providedLayer.getZIndex();
      const indexTo = preferredZIndex;
      const incrementValue = indexTo > indexFrom ? -1 : 1;
      for (const lyr of this.mapLayers.filter((lyr) => lyr != providedLayer)) {
        const currentZIndex = lyr.getZIndex();
        if (
          (currentZIndex >= indexFrom && currentZIndex <= indexTo) ||
          (currentZIndex <= indexFrom && currentZIndex >= indexTo)
        ) {
          lyr.setZIndex(lyr.getZIndex() + incrementValue);
        }
      }
      providedLayer.setZIndex(preferredZIndex);
      this.HsEventBusService.layerManagerUpdates.next(providedLayer);
    }
  }
  /**
   * Gets layer property of container object or the actual provided ol layer
   * @param layer Provided layer
   * @returns Returns ol layer
   */
  private getOlLayer(
    providedLayer: PhysicalListItem | Layer<Source>
  ): Layer<Source> {
    if (this.HsUtilsService.instOf(providedLayer, Layer)) {
      return providedLayer as Layer<Source>;
    } else {
      return (providedLayer as PhysicalListItem).layer;
    }
  }
  /**
   * Gets all layer ZIndex values from the layer list
   * @returns Returns array of ZIndex values
   */
  private zIndexList(): number[] {
    return this.mapLayers.map((lyr) => lyr.getZIndex() || 0);
  }
  /**
   * Gets maximum value from ZIndex value array
   * @returns Returns max ZIndex value
   */
  getMaxZ(): number {
    return Math.max(...this.zIndexList());
  }
  /**
   * Gets minimum value from ZIndex value array
   * @returns Returns min ZIndex value
   */
  getMinZ(): number {
    return Math.min(...this.zIndexList());
  }
}
