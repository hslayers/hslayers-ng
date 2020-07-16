import {Component, Input} from '@angular/core';
import {HsDialogComponent} from '../layout/dialog-component.interface';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerManagerService} from './layermanager.service';
@Component({
  selector: 'hs-layermanager-remove-all-dialog',
  template: require('./partials/dialog_removeall.html'),
})
export class HsLayerManagerRemoveAllDialogComponent
  implements HsDialogComponent {
  removeAllModalVisible = true;
  @Input() data: any;

  constructor(
    private HsLayerManagerService: HsLayerManagerService,
    private HsEventBusService: HsEventBusService
  ) {}

  removeAllLayers(reloadComposition?: boolean): void {
    this.HsLayerManagerService.removeAllLayers();
    if (reloadComposition) {
      this.HsEventBusService.compositionLoadStarts.next(
        this.HsLayerManagerService.composition_id
      );
    }
    this.removeAllModalVisible = false;
  }
}
