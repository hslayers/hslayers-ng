import {Component, ViewRef, inject} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {FileDataObject, VectorDataObject} from 'hslayers-ng/types';
import {HsDialogComponent} from '../dialog-component.interface';
import {HsDialogContainerService} from '../dialog-container.service';
import {HsDialogItem} from '../dialog-item';
import {HsRenameLayerDialogComponent} from '../rename-layer/rename-layer.component';

@Component({
  selector: 'hs-layer-overwrite-dialog',
  templateUrl: './overwrite-layer.component.html',
  imports: [TranslatePipe],
})
export class HsLayerOverwriteDialogComponent implements HsDialogComponent {
  hsDialogContainerService = inject(HsDialogContainerService);

  dialogItem: HsDialogItem;
  viewRef: ViewRef;
  data: {
    dataObj: FileDataObject | VectorDataObject;
    repetive: boolean;
  };

  /**
   * Close the dialog
   */
  close(): void {
    this.hsDialogContainerService.destroy(this);
    this.dialogItem.resolve('cancel');
  }

  /**
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
