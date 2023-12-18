import {Component, ViewRef} from '@angular/core';

import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
@Component({
  selector: 'hs-compositions-warning-dialog',
  templateUrl: './warning-dialog.component.html',
})
export class HsCompositionsWarningDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;

  constructor(public HsDialogContainerService: HsDialogContainerService) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
