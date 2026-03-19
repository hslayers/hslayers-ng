import {Component, ViewRef, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {
  HsDialogComponent,
  HsDialogContainerService,
  HsDialogItem,
} from 'hslayers-ng/common/dialogs';
@Component({
  selector: 'hs-copy-layer-dialog',
  templateUrl: './copy-layer-dialog.component.html',
  imports: [FormsModule, TranslatePipe],
})
export class HsCopyLayerDialogComponent implements HsDialogComponent {
  hsDialogContainerService = inject(HsDialogContainerService);

  dialogItem: HsDialogItem;
  viewRef: ViewRef;
  data: {
    title: string;
    message: string;
    layerTitle: string;
  };

  yes(): void {
    this.hsDialogContainerService.destroy(this);
    this.dialogItem.resolve({
      confirmed: 'yes',
      layerTitle: this.data.layerTitle,
    });
  }

  no(): void {
    this.hsDialogContainerService.destroy(this);
    this.dialogItem.resolve('no');
  }
}
