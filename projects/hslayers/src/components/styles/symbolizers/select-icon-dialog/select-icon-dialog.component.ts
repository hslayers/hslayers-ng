import {Component, ViewRef} from '@angular/core';

import {HsConfig, SymbolizerIcon} from '../../../../config.service';
import {HsDialogComponent} from '../../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsDialogItem} from '../../../layout/dialogs/dialog-item';
import {HsIconSymbolizerComponent} from '../icon-symbolizer/icon-symbolizer.component';

@Component({
  selector: 'hs-select-icon-dialog',
  templateUrl: './select-icon-dialog.component.html',
})
export class HsSelectIconDialogComponent implements HsDialogComponent {
  dialogItem?: HsDialogItem;
  viewRef: ViewRef;
  data: HsIconSymbolizerComponent;

  constructor(
    private hsDialogContainerService: HsDialogContainerService,
    public hsConfig: HsConfig,
  ) {}

  cancel(): void {
    this.data.selectedIcon = null;
    this.hsDialogContainerService.destroy(this);
  }

  confirm(): void {
    if (this.data.selectedIcon) {
      this.data.symbolizer.image = this.data.selectedIcon.url;
    }
    this.data.emitChange();
    this.hsDialogContainerService.destroy(this);
  }

  iconSelected(icon: SymbolizerIcon): void {
    this.data.selectedIcon = icon;
  }
}
