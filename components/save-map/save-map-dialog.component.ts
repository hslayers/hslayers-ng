import {Component, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
@Component({
  selector: 'hs.save-map-dialog-save',
  template: require('./partials/dialog_save.html'),
})
export class HsSaveMapDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: {endpoint};

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsSaveMapManagerService: HsSaveMapManagerService
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
