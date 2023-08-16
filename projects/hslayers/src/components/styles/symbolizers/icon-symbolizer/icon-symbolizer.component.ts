import {Component, Input} from '@angular/core';

import {IconSymbolizer} from 'geostyler-style';

import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsSelectIconDialogComponent} from '../select-icon-dialog/select-icon-dialog.component';
import {HsStylerPartBaseComponent} from '../../style-part-base.component';
import {SymbolizerIcon} from '../../../../config.service';

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
  }
}
