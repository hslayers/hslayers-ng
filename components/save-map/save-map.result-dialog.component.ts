import {Component, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../layout/dialog-component.interface';
import {HsDialogContainerService} from '../layout/dialog-container.service';
@Component({
  selector: 'hs.save-map-dialog-result',
  template: require('./partials/dialog_result.html'),
})
export class HsSaveMapResultDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;

  constructor(private HsDialogContainerService: HsDialogContainerService) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
