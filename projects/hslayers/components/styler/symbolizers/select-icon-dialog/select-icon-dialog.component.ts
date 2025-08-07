import {Component, ViewRef, inject} from '@angular/core';

import {HsConfig, SymbolizerIcon} from 'hslayers-ng/config';
import {
  HsDialogComponent,
  HsDialogContainerService,
  HsDialogItem,
} from 'hslayers-ng/common/dialogs';
import {HsIconSymbolizerComponent} from '../icon-symbolizer/icon-symbolizer.component';

@Component({
  selector: 'hs-select-icon-dialog',
  templateUrl: './select-icon-dialog.component.html',
  standalone: false,
})
export class HsSelectIconDialogComponent implements HsDialogComponent {
  private hsDialogContainerService = inject(HsDialogContainerService);
  hsConfig = inject(HsConfig);

  dialogItem?: HsDialogItem;
  viewRef: ViewRef;
  data: HsIconSymbolizerComponent;

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
