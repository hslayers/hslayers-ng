import {
  CdkDragDrop,
  moveItemInArray,
  CdkDropList,
  CdkDrag,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';

import {buffer, debounceTime} from 'rxjs';

import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerShiftingService} from 'hslayers-ng/services/layer-shifting';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgClass} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'hs-layermanager-physical-layer-list',
  templateUrl: './physical-layerlist.component.html',
  styleUrls: ['./physical-layerlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [CdkDropList, CdkDrag, NgClass, TranslatePipe],
})
export class HsLayerPhysicalListComponent implements OnInit {
  private hsEventBusService = inject(HsEventBusService);
  private hsLayerShiftingService = inject(HsLayerShiftingService);
  private cdr = inject(ChangeDetectorRef);

  layerShiftingAppRef;

  constructor() {
    this.hsEventBusService.layerManagerUpdates
      .pipe(
        buffer(
          // In case 100ms has passed without another emit => close buffer and emit value
          this.hsEventBusService.layerManagerUpdates.pipe(debounceTime(100)),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((layers) => {
        this.hsLayerShiftingService.fillLayers();
        //No layers or multiple eg. reset/multi removal.
        if (layers.length === 0 || layers.length > 1) {
          this.cdr.markForCheck();
          return;
        }
        //Single layer most likely moved.
        const layer = layers[0];
        const layerFound = this.hsLayerShiftingService.layersCopy.find(
          (wrapper) => wrapper.layer == layer,
        );
        if (layerFound !== undefined) {
          layerFound.active = true;
        }
      });
  }

  ngOnInit(): void {
    this.layerShiftingAppRef = this.hsLayerShiftingService;
    this.hsLayerShiftingService.fillLayers();
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
