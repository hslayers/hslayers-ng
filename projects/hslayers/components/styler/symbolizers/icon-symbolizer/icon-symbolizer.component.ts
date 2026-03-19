import {Component, Input, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';
import {take} from 'rxjs';

import {IconSymbolizer} from 'geostyler-style';

import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsSelectIconDialogComponent} from '../select-icon-dialog/select-icon-dialog.component';
import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';
import {SymbolizerIcon} from 'hslayers-ng/config';

@Component({
  selector: 'hs-icon-symbolizer',
  templateUrl: './icon-symbolizer.component.html',
  imports: [FormsModule, NgClass, TranslatePipe],
})
export class HsIconSymbolizerComponent extends HsStylerPartBaseComponent {
  private hsDialogContainerService = inject(HsDialogContainerService);

  @Input() symbolizer: IconSymbolizer;
  @Input() submenu = false;
  selectedIcon?: SymbolizerIcon;

  anchors = [
    'center',
    'left',
    'right',
    'top',
    'bottom',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ];

  showIconSelector(): void {
    this.hsDialogContainerService.create(HsSelectIconDialogComponent, this);
    this.hsDialogContainerService.dialogDestroyObserver
      .pipe(take(1))
      .subscribe((el) => {
        if (this.selectedIcon) {
          setTimeout(() => {
            this.emitChange();
          }, 250);
        }
      });
  }
}
