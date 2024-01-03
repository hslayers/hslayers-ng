import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsEventBusService} from 'hslayers-ng/shared/core';
import {HsLayerShiftingService} from 'hslayers-ng/shared/layer-shifting';

@Component({
  selector: 'hs-layermanager-physical-layer-list',
  templateUrl: './physical-layerlist.component.html',
  styleUrls: ['./physical-layerlist.component.scss'],
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
