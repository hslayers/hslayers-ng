import {Component, Input} from '@angular/core';
import {take} from 'rxjs';

import {IconSymbolizer} from 'geostyler-style';

import {HsDialogContainerService} from 'hslayers-ng/components/layout';
import {HsSelectIconDialogComponent} from '../select-icon-dialog/select-icon-dialog.component';
import {HsStylerPartBaseComponent} from '../../style-part-base.component';
import {SymbolizerIcon} from 'hslayers-ng/config';

@Component({
  selector: 'hs-icon-symbolizer',
  templateUrl: './icon-symbolizer.component.html',
})
export class HsIconSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: IconSymbolizer;
  @Input() submenu = false;
  selectedIcon?: SymbolizerIcon;

  constructor(private hsDialogContainerService: HsDialogContainerService) {
    super();
  }

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
