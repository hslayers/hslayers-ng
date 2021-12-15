import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsConfig} from '../../../config.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerManagerService} from '../layermanager.service';
import {HsLayerShiftingService} from '../../../common/layer-shifting/layer-shifting.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';

@Component({
  selector: 'hs-layermanager-physical-layer-list',
  templateUrl: './physical-layerlist.html',
  styleUrls: ['./physical-layerlist.component.scss'],
})
export class HsLayerPhysicalListComponent implements OnDestroy {
  layerManagerUpdatesSubscription: Subscription;
  constructor(
    public HsLayerManagerService: HsLayerManagerService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsEventBusService: HsEventBusService,
    public HsLayerShiftingService: HsLayerShiftingService,
    public HsConfig: HsConfig
  ) {
    this.HsLayerShiftingService.fillLayers();
    this.layerManagerUpdatesSubscription =
      this.HsEventBusService.layerManagerUpdates.subscribe((layer: any) => {
        this.HsLayerShiftingService.fillLayers();
        if (layer !== undefined) {
          const layerFound = this.HsLayerShiftingService.layersCopy.find(
            (wrapper) =>
              wrapper.layer == layer || wrapper.layer == layer.layer
          );
          if (layerFound !== undefined) {
            layerFound.active = true;
          }
        }
      });
  }
  ngOnDestroy(): void {
    this.layerManagerUpdatesSubscription.unsubscribe();
  }
  drop(event: CdkDragDrop<any[]>): void {
    const draggedLayer = event.container.data[event.previousIndex];
    const replacedLayer = event.container.data[event.currentIndex];

    moveItemInArray(
      this.HsLayerShiftingService.layersCopy,
      event.previousIndex,
      event.currentIndex
    );

    this.HsLayerShiftingService.moveTo(draggedLayer, replacedLayer.layer);
  }
}
