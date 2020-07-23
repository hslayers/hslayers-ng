import {Component, Input, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../layout/dialog-component.interface';
import {HsDialogContainerService} from '../layout/dialog-container.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerManagerService} from './layermanager.service';
@Component({
  selector: 'hs-layermanager-remove-all-dialog',
  template: require('./partials/dialog_removeall.html'),
})
export class HsLayerManagerRemoveAllDialogComponent
  implements HsDialogComponent {
  @Input() data: any;
  viewRef: ViewRef;

  constructor(
    private HsLayerManagerService: HsLayerManagerService,
    private HsDialogContainerService: HsDialogContainerService,
    private HsEventBusService: HsEventBusService
  ) {}

  removeAllLayers(reloadComposition?: boolean): void {
    this.HsLayerManagerService.removeAllLayers();
    if (reloadComposition) {
      this.HsEventBusService.compositionLoadStarts.next(
        this.HsLayerManagerService.composition_id
      );
    }
    this.close();
  }

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
