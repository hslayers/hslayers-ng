import BaseLayer from 'ol/layer/Base';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerManagerService} from './layermanager.service';
import {Injectable} from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class HsLayermanagerPhysicalListService {
  layersCopy: Array<{
    title: string;
    layer: BaseLayer;
    active?: boolean;
  }> = [];
  private readonly reversed = this.HsConfig.reverseLayerList;

  constructor(
    public HsEventBusService: HsEventBusService,
    public HsLayerManagerService: HsLayerManagerService,
    public HsConfig: HsConfig
  ) {}
  fillLayers(): any {
    if (this.HsLayerManagerService.data.layers == undefined) {
      return;
    }
    this.layersCopy = this.HsLayerManagerService.sortLayersByZ(
      this.HsLayerManagerService.data.layers.map((l) => {
        return {title: l.title, layer: l.layer};
      })
    );
  }
  moveLayer(baseLayer: BaseLayer, orient: string): void {
    const currentLayerIndex = this.layersCopy.indexOf(baseLayer);
    switch (orient.toLocaleLowerCase()) {
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
  setLayerZIndex(indexTo: number, layer: any): void {
    const layerSwitchedWith = this.layersCopy[indexTo].layer;
    const interactedLayerZIndex = layer.getZIndex();
    layer.setZIndex(layerSwitchedWith.getZIndex());
    layerSwitchedWith.setZIndex(interactedLayerZIndex);
    this.HsEventBusService.layerManagerUpdates.next(layer);
  }
  moveToBottom(baseLayer: BaseLayer): void {
    const preferredZIndex = this.reversed ? this.getMaxZ() : this.getMinZ();
    this.moveAndShift(baseLayer, preferredZIndex, true);
  }

  moveToTop(baseLayer: BaseLayer): void {
    const preferredZIndex = this.reversed ? this.getMaxZ() : this.getMinZ();
    this.moveAndShift(baseLayer, preferredZIndex, false);
  }

  private moveAndShift(layer: any, preferredZIndex: number, shiftDir: boolean) {
    if (layer.layer.getZIndex() != preferredZIndex) {
      let zIndexVariable = this.getZIndexVariable(shiftDir);
      for (const lyr of this.layersCopy.filter((lyr) => lyr != layer)) {
        lyr.layer.setZIndex(zIndexVariable);
        zIndexVariable += this.reversed ? -1 : 1;
      }
      layer.layer.setZIndex(preferredZIndex);
      this.HsEventBusService.layerManagerUpdates.next(layer);
    }
  }

  getZIndexVariable(toTheListTop: boolean): number {
    if (this.reversed) {
      return !toTheListTop ? this.getMaxZ() - 1 : this.getMaxZ();
    } else {
      return toTheListTop ? this.getMinZ() : this.getMinZ() + 1;
    }
  }

  private zIndexList() {
    return this.layersCopy.map((lyr) => lyr.layer.getZIndex() || 0);
  }

  getMaxZ(): number {
    return Math.max(...this.zIndexList());
  }

  getMinZ(): number {
    return Math.min(...this.zIndexList());
  }
}
