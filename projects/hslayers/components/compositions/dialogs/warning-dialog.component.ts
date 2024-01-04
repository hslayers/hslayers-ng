import {Component, ViewRef} from '@angular/core';

import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
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
