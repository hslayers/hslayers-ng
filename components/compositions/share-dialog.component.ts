import {Component, ViewRef} from '@angular/core';
import {HsCompositionsService} from './compositions.service';
import {HsDialogComponent} from '../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
@Component({
  selector: 'hs.compositions-share-dialog',
  template: require('./partials/dialog_share.html'),
})
export class HsCompositionsShareDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;

  constructor(
    private HsDialogContainerService: HsDialogContainerService,
    private HsCompositionsService: HsCompositionsService
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
