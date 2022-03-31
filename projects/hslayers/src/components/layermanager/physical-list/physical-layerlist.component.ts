import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerShiftingService} from '../../../common/layer-shifting/layer-shifting.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';

@Component({
  selector: 'hs-layermanager-physical-layer-list',
  templateUrl: './physical-layerlist.component.html',
  styleUrls: ['./physical-layerlist.component.scss'],
})
export class HsLayerPhysicalListComponent implements OnDestroy, OnInit {
  layerManagerUpdatesSubscription: Subscription;
  @Input() app = 'default';
  layerShiftingAppRef;
  constructor(
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsEventBusService: HsEventBusService,
    private hsLayerShiftingService: HsLayerShiftingService
  ) {}
  ngOnInit(): void {
    this.layerShiftingAppRef = this.hsLayerShiftingService.get(this.app);
    this.hsLayerShiftingService.fillLayers(this.app);
    this.layerManagerUpdatesSubscription =
      this.hsEventBusService.layerManagerUpdates.subscribe(({layer, app}) => {
        this.hsLayerShiftingService.fillLayers(this.app);
        if (layer !== undefined) {
          const layerFound = this.hsLayerShiftingService
            .get(app)
            .layersCopy.find((wrapper) => wrapper.layer == layer);
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
      event.currentIndex
    );

    this.hsLayerShiftingService.moveTo(
      draggedLayer,
      replacedLayer.layer,
      this.app
    );
  }

  /**
   * Get title translation
   * @param title - Title to translate
   */
  translateTitle(title: string): string {
    return this.hsLayerUtilsService.translateTitle(title, this.app);
  }
}
