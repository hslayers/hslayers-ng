import BaseLayer from 'ol/layer/Base';
import {Component, Input} from '@angular/core';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
@Component({
  selector: 'hs-layermanager-physical-layer-list',
  template: require('./partials/physical-layerlist.html'),
})
export class HsLayerPhysicalListComponent {
  @Input() layers: any;
  constructor(
    public HsLayerManagerService: HsLayerManagerService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsEventBusService: HsEventBusService
  ) {
    this.HsEventBusService.layerManagerUpdates.subscribe(() => {
      this.sortLayers();
    });
  }
  moveLayer(layer, orient: string): void {
    const currentLayerIndex = this.layers.indexOf(layer);
    switch (orient) {
      case 'up':
        if (currentLayerIndex != 0) {
          this.setLayerZIndex(currentLayerIndex - 1, layer.layer);
        }
        break;
      case 'down':
        if (currentLayerIndex < this.layers.length - 1) {
          this.setLayerZIndex(currentLayerIndex + 1, layer.layer);
        }
        break;
      default:
    }
  }
  setLayerZIndex(indexTo: number, layer: BaseLayer): void {
    const layerSwitchedWith = this.layers[indexTo].layer;
    const interactedLayerZIndex = layer.getZIndex();
    layer.setZIndex(layerSwitchedWith.getZIndex());
    layerSwitchedWith.setZIndex(interactedLayerZIndex);
    this.sortLayers();
  }
  sortLayers(): void {
    this.layers = this.HsLayerManagerService.sortLayersByValue(this.layers);
  }
}
