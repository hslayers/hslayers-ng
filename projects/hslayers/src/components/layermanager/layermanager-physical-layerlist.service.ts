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
    let preferredZIndex: number;
    if (this.HsConfig.reverseLayerList) {
      preferredZIndex = this.getMinZIndex();
    } else {
      preferredZIndex = this.getMaxZIndex();
    }
    if (baseLayer.layer.getZIndex() != preferredZIndex) {
      this.shiftLayers(baseLayer, true);
      baseLayer.layer.setZIndex(preferredZIndex);
      this.HsEventBusService.layerManagerUpdates.next(baseLayer);
    }
  }
  moveToTop(baseLayer: BaseLayer): void {
    let preferredZIndex: number;
    if (this.HsConfig.reverseLayerList) {
      preferredZIndex = this.getMaxZIndex();
    } else {
      preferredZIndex = this.getMinZIndex();
    }
    if (baseLayer.layer.getZIndex() != preferredZIndex) {
      this.shiftLayers(baseLayer, false);
      baseLayer.layer.setZIndex(preferredZIndex);
      this.HsEventBusService.layerManagerUpdates.next(baseLayer);
    }
  }
  shiftLayers(baseLayer: BaseLayer, toTheListTop: boolean): void {
    let zIndexVariable = this.getZIndexVariable(toTheListTop);
    this.layersCopy.forEach((lyr) => {
      if (lyr != baseLayer) {
        lyr.layer.setZIndex(zIndexVariable);
        if (this.HsConfig.reverseLayerList) {
          --zIndexVariable;
        } else {
          ++zIndexVariable;
        }
      }
    });
  }
  getZIndexVariable(toTheListTop: boolean): number {
    let zIndexVariable: number;
    if (this.HsConfig.reverseLayerList) {
      if (!toTheListTop) {
        zIndexVariable = this.getMaxZIndex() - 1;
      } else {
        zIndexVariable = this.getMaxZIndex();
      }
    } else {
      if (toTheListTop) {
        zIndexVariable = this.getMinZIndex();
      } else {
        zIndexVariable = this.getMinZIndex() + 1;
      }
    }
    return zIndexVariable;
  }
  getMaxZIndex(): number {
    return Math.max(
      ...this.layersCopy.map((lyr) => {
        return lyr.layer.getZIndex() || 0;
      })
    );
  }
  getMinZIndex(): number {
    return Math.min(
      ...this.layersCopy.map((lyr) => {
        return lyr.layer.getZIndex() || 0;
      })
    );
  }
}
