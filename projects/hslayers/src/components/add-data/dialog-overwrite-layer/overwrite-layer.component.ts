import {Component, ViewRef} from '@angular/core';

import {FileDataObject} from '../file/types/file-data-object.type';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsDialogItem} from '../../layout/dialogs/dialog-item';
import {HsRenameLayerDialogComponent} from '../dialog-rename-layer/rename-layer.component';
import {VectorDataObject} from '../vector/vector-data.type';

@Component({
  selector: 'hs-layer-overwrite-dialog',
  templateUrl: './overwrite-layer.component.html',
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
