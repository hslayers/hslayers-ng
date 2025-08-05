import {Component, OnInit, ViewRef} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {HsDialogComponent} from '../dialog-component.interface';
import {HsDialogContainerService} from '../dialog-container.service';
import {HsDialogItem} from '../dialog-item';

@Component({
  selector: 'hs-rename-layer-dialog',
  templateUrl: './rename-layer.component.html',
  imports: [TranslatePipe, FormsModule],
})
export class HsRenameLayerDialogComponent implements HsDialogComponent, OnInit {
  dialogItem: HsDialogItem;
  viewRef: ViewRef;
  newLayerName: string;
  data: {
    currentName: string;
  };

  constructor(public hsDialogContainerService: HsDialogContainerService) {}
  ngOnInit(): void {
    this.newLayerName = this.data.currentName;
  }

  /**
   * Close the dialog
   */
  close(): void {
    this.hsDialogContainerService.destroy(this);
    this.dialogItem.resolve(false);
  }

  /**
   * Continue with the new layer name from user's input
   */
  continue(): void {
    this.hsDialogContainerService.destroy(this);
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
