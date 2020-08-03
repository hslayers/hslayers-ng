import {Component, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../layout/dialog-component.interface';
import {HsDialogContainerService} from '../layout/dialog-container.service';
@Component({
  selector: 'hs.save-map-dialog-save',
  template: require('./partials/dialog_save.html'),
})
export class HsSaveMapDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;

  constructor(private HsDialogContainerService: HsDialogContainerService) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
