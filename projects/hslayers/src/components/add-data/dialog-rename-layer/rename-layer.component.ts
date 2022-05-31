import {Component, OnInit, ViewRef} from '@angular/core';

import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsDialogItem} from '../../layout/dialogs/dialog-item';

@Component({
  selector: 'hs-rename-layer-dialog',
  templateUrl: './rename-layer.component.html',
})
export class HsRenameLayerDialogComponent implements HsDialogComponent, OnInit {
  dialogItem: HsDialogItem;
  viewRef: ViewRef;
  newLayerName: string;
  data: {
    currentName: string;
    app: string;
  };

  constructor(public hsDialogContainerService: HsDialogContainerService) {}
  ngOnInit(): void {
    this.newLayerName = this.data.currentName;
  }

  /**
   * @public
   * Close the dialog
   */
  close(): void {
    this.hsDialogContainerService.destroy(this, this.data.app);
    this.dialogItem.resolve(false);
  }

  /**
   * @public
   * Continue with the new layer name from user's input
   */
  continue(): void {
    this.hsDialogContainerService.destroy(this, this.data.app);
    this.dialogItem.resolve(this.newLayerName);
  }

  handleKeyUp(e: KeyboardEvent): void {
    if (e.key == 'Enter') {
      this.continue();
    } else if (e.key == 'Escape') {
      this.close();
    }
  }
}
