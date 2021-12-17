import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, OnDestroy} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
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
    public hsLayerManagerService: HsLayerManagerService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsEventBusService: HsEventBusService,
    public hsLayerShiftingService: HsLayerShiftingService,
    public hsConfig: HsConfig
  ) {
    this.hsLayerShiftingService.fillLayers();
    this.layerManagerUpdatesSubscription =
      this.hsEventBusService.layerManagerUpdates.subscribe(
        (layer: Layer<Source>) => {
          this.hsLayerShiftingService.fillLayers();
          if (layer !== undefined) {
            const layerFound = this.hsLayerShiftingService.layersCopy.find(
              (wrapper) => wrapper.layer == layer
            );
            if (layerFound !== undefined) {
              layerFound.active = true;
            }
          }
        }
      );
  }
  ngOnDestroy(): void {
    this.layerManagerUpdatesSubscription.unsubscribe();
  }
  drop(event: CdkDragDrop<any[]>): void {
    const draggedLayer = event.container.data[event.previousIndex];
    const replacedLayer = event.container.data[event.currentIndex];

    moveItemInArray(
      this.hsLayerShiftingService.layersCopy,
      event.previousIndex,
      event.currentIndex
    );

    this.hsLayerShiftingService.moveTo(draggedLayer, replacedLayer.layer);
  }
}
