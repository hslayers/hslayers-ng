import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerShiftingService} from 'hslayers-ng/services/layer-shifting';

@Component({
  selector: 'hs-layermanager-physical-layer-list',
  templateUrl: './physical-layerlist.component.html',
  styleUrls: ['./physical-layerlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsLayerPhysicalListComponent implements OnDestroy, OnInit {
  layerManagerUpdatesSubscription: Subscription;
  layerShiftingAppRef;
  constructor(
    private hsEventBusService: HsEventBusService,
    private hsLayerShiftingService: HsLayerShiftingService,
  ) {}

  ngOnInit(): void {
    this.layerShiftingAppRef = this.hsLayerShiftingService;
    this.hsLayerShiftingService.fillLayers();
    this.layerManagerUpdatesSubscription =
      this.hsEventBusService.layerManagerUpdates.subscribe((layer) => {
        this.hsLayerShiftingService.fillLayers();
        if (layer !== undefined) {
          const layerFound = this.hsLayerShiftingService.layersCopy.find(
            (wrapper) => wrapper.layer == layer,
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
      this.layerShiftingAppRef.layersCopy,
      event.previousIndex,
      event.currentIndex,
    );

    this.hsLayerShiftingService.moveTo(draggedLayer, replacedLayer.layer);
  }
}
