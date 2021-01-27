import BaseLayer from 'ol/layer/Base';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerManagerService} from './layermanager.service';
import {Injectable} from '@angular/core';

export type PhysicalListItem = {
  title: string;
  layer: BaseLayer;
  active?: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class HsLayermanagerPhysicalListService {
  layersCopy: PhysicalListItem[];
  constructor(
    public HsEventBusService: HsEventBusService,
    public HsLayerManagerService: HsLayerManagerService,
    public HsConfig: HsConfig
  ) {}
  /**
   * Copies layers from Layermanager layer list for the physical layer list
   */
  fillLayers(): void {
    if (this.HsLayerManagerService.data.layers == undefined) {
      return;
    }
    this.layersCopy = this.HsLayerManagerService.sortLayersByZ(
      this.HsLayerManagerService.data.layers.map((l) => {
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
  private setLayerZIndex(indexTo: number, layer: BaseLayer): void {
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
  moveToBottom(layer: PhysicalListItem | BaseLayer): void {
    if (layer === undefined) {
      return;
    }
    this.moveAndShift(this.getOlLayer(layer), this.getMinZ());
  }
  /**
   * Move the provided layer over all other rendered layers on the map
   * @param layer provided layer
   */
  moveToTop(layer: PhysicalListItem | BaseLayer): void {
    if (layer === undefined) {
      return;
    }
    this.moveAndShift(this.getOlLayer(layer), this.getMaxZ());
  }
  /**
   * Move the provided layer in the middle between all other rendered layers on the map
   * @param layer provided layer
   */
  moveTo(
    layer: PhysicalListItem | BaseLayer,
    target: number | PhysicalListItem | BaseLayer
  ): void {
    if (layer === undefined) {
      return;
    }
    if (target.layer != undefined) {
      //Wrapped layer provided
      target = target.layer.getZIndex();
    } else if (typeof target != 'number') {
      //OL layer provided
      target = target.getZIndex();
    }
    this.moveAndShift(this.getOlLayer(layer), target);
  }
  /**
   * Move and shift layer order to make changes on the map
   * @param providedLayer provided layer
   * @param preferredZIndex ZIndex value to switch to
   */
  private moveAndShift(
    providedLayer: BaseLayer,
    preferredZIndex: number
  ): void {
    if (providedLayer.getZIndex() != preferredZIndex) {
      const indexFrom = providedLayer.getZIndex();
      const indexTo = preferredZIndex;
      const incrementValue = indexTo > indexFrom ? -1 : 1;
      for (const lyr of this.layersCopy.filter(
        (lyr) => lyr.layer != providedLayer
      )) {
        const currentZIndex = lyr.layer.getZIndex();
        if (
          (currentZIndex >= indexFrom && currentZIndex <= indexTo) ||
          (currentZIndex <= indexFrom && currentZIndex >= indexTo)
        ) {
          lyr.layer.setZIndex(lyr.layer.getZIndex() + incrementValue);
        }
      }
      providedLayer.setZIndex(preferredZIndex);
      this.HsEventBusService.layerManagerUpdates.next(providedLayer);
    }
  }
  /**
   * Gets ol layer from provided layer
   * @param layer Provided layer
   * @returns Returns ol layer
   */
  private getOlLayer(providedLayer: PhysicalListItem | BaseLayer): BaseLayer {
    return providedLayer?.layer ? providedLayer.layer : providedLayer;
  }
  /**
   * Gets all layer ZIndex values from the layer list
   * @returns Returns array of ZIndex values
   */
  private zIndexList(): number[] {
    return this.layersCopy.map((lyr) => lyr.layer.getZIndex() || 0);
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
