import {Component, ViewRef} from '@angular/core';

import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsDialogItem} from '../../layout/dialogs/dialog-item';
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
