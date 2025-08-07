import {Component, ViewRef, inject} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {
  HsDialogComponent,
  HsDialogContainerService,
  HsDialogItem,
} from 'hslayers-ng/common/dialogs';

@Component({
  selector: 'hs-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  imports: [TranslatePipe],
})
export class HsConfirmDialogComponent implements HsDialogComponent {
  hsDialogContainerService = inject(HsDialogContainerService);

  dialogItem: HsDialogItem;
  viewRef: ViewRef;
  data: any;

  yes(): void {
    this.hsDialogContainerService.destroy(this);
    this.dialogItem.resolve('yes');
  }

  no(): void {
    this.hsDialogContainerService.destroy(this);
    this.dialogItem.resolve('no');
  }
}
