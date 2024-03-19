import {Component, ViewRef} from '@angular/core';

import {
  HsDialogComponent,
  HsDialogContainerService,
  HsDialogItem,
} from 'hslayers-ng/common/dialogs';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  standalone: true,
  imports: [TranslateCustomPipe],
})
export class HsConfirmDialogComponent implements HsDialogComponent {
  dialogItem: HsDialogItem;
  constructor(public HsDialogContainerService: HsDialogContainerService) {}
  viewRef: ViewRef;
  data: any;

  yes(): void {
    this.HsDialogContainerService.destroy(this);
    this.dialogItem.resolve('yes');
  }

  no(): void {
    this.HsDialogContainerService.destroy(this);
    this.dialogItem.resolve('no');
  }
}
