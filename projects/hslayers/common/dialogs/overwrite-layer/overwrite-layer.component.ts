import {Component, ViewRef} from '@angular/core';
import {NgIf} from '@angular/common';

import {FileDataObject} from 'hslayers-ng/types';
import {HsDialogComponent} from '../dialog-component.interface';
import {HsDialogContainerService} from '../dialog-container.service';
import {HsDialogItem} from '../dialog-item';
import {HsRenameLayerDialogComponent} from '../rename-layer/rename-layer.component';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {VectorDataObject} from 'hslayers-ng/types';

@Component({
  selector: 'hs-layer-overwrite-dialog',
  templateUrl: './overwrite-layer.component.html',
  standalone: true,
  imports: [TranslateCustomPipe, NgIf],
})
export class HsLayerOverwriteDialogComponent implements HsDialogComponent {
  dialogItem: HsDialogItem;
  viewRef: ViewRef;
  data: {
    dataObj: FileDataObject | VectorDataObject;
    repetive: boolean;
  };

  constructor(public hsDialogContainerService: HsDialogContainerService) {}

  /**
   * @public
   * Close the dialog
   */
  close(): void {
    this.hsDialogContainerService.destroy(this);
    this.dialogItem.resolve('cancel');
  }

  /**
   * @public
   * Overwrite the existing layer with current layer data
   */
  overwrite(): void {
    this.hsDialogContainerService.destroy(this);
    this.dialogItem.resolve('overwrite');
  }

  async renameAndAdd(): Promise<void> {
    const renameDialogRef = this.hsDialogContainerService.create(
      HsRenameLayerDialogComponent,
      {
        currentName: this.data.dataObj.name,
      },
    );
    const result = await renameDialogRef.waitResult();
    if (!result) {
      //Do nothing
    } else {
      this.data.dataObj.name = result;
      this.data.dataObj.title = result;

      this.hsDialogContainerService.destroy(this);
      this.dialogItem.resolve('add');
    }
  }
}
