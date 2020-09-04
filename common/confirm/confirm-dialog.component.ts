import {Component, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../../components/layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../components/layout/dialogs/dialog-container.service';

@Component({
  selector: 'hs.confirm-dialog',
  template: require('./confirm-dialog.html'),
})
export class HsConfirmDialogComponent implements HsDialogComponent {
  dialogItem: any;
  constructor(private HsDialogContainerService: HsDialogContainerService) {}
  viewRef: ViewRef;
  data: any;

  yes(): void {
    this.HsDialogContainerService.destroy(this);
    this.dialogItem.resolve.resolve('yes');
  }

  no(): void {
    this.HsDialogContainerService.destroy(this);
    this.dialogItem.resolve('no');
  }
}
