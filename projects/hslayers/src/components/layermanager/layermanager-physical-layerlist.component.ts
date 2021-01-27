import {Component} from '@angular/core';
import {HsConfig} from './../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayermanagerPhysicalListService} from './layermanager-physical-layerlist.service';
@Component({
  selector: 'hs-layermanager-physical-layer-list',
  templateUrl: './partials/physical-layerlist.html',
  styles: [
    `
      .activeLayer {
        background-color: rgba(0, 0, 0, 0.2);
      }
    `,
  ],
})
export class HsLayerPhysicalListComponent {
  constructor(
    public HsLayerManagerService: HsLayerManagerService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsEventBusService: HsEventBusService,
    public HsLayermanagerPhysicalListService: HsLayermanagerPhysicalListService,
    public HsConfig: HsConfig
  ) {
    this.HsLayermanagerPhysicalListService.fillLayers();
    this.HsEventBusService.layerManagerUpdates.subscribe((layer: any) => {
      this.HsLayermanagerPhysicalListService.fillLayers();
      if (layer !== undefined) {
        const layerFound = this.HsLayermanagerPhysicalListService.layersCopy.find(
          (wrapper) => wrapper.layer == layer || wrapper.layer == layer.layer
        );
        if (layerFound !== undefined) {
          layerFound.active = true;
        }
      }
    });
  }
}
