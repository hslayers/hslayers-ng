import {Component, ViewRef} from '@angular/core';

import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDialogItem} from 'hslayers-ng/common/dialogs';
@Component({
  selector: 'hs-copy-layer-dialog',
  templateUrl: './copy-layer-dialog.component.html',
})
export class HsCopyLayerDialogComponent implements HsDialogComponent {
  dialogItem: HsDialogItem;
  constructor(public HsDialogContainerService: HsDialogContainerService) {}
  viewRef: ViewRef;
  data: {
    title: string;
    message: string;
    layerTitle: string;
  };

  yes(): void {
    this.HsDialogContainerService.destroy(this);
    this.dialogItem.resolve({
      confirmed: 'yes',
      layerTitle: this.data.layerTitle,
    });
  }

  no(): void {
    this.HsDialogContainerService.destroy(this);
    this.dialogItem.resolve('no');
  }
}
