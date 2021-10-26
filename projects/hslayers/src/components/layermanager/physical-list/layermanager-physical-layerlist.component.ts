import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsConfig} from '../../../config.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerManagerService} from '../layermanager.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayermanagerPhysicalListService} from './layermanager-physical-layerlist.service';

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
    public HsLayermanagerPhysicalListService: HsLayermanagerPhysicalListService,
    public HsConfig: HsConfig
  ) {
    this.HsLayermanagerPhysicalListService.fillLayers();
    this.layerManagerUpdatesSubscription =
      this.HsEventBusService.layerManagerUpdates.subscribe((layer: any) => {
        this.HsLayermanagerPhysicalListService.fillLayers();
        if (layer !== undefined) {
          const layerFound =
            this.HsLayermanagerPhysicalListService.layersCopy.find(
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
      this.HsLayermanagerPhysicalListService.layersCopy,
      event.previousIndex,
      event.currentIndex
    );

    this.HsLayermanagerPhysicalListService.moveTo(
      draggedLayer,
      replacedLayer.layer
    );
  }
}
