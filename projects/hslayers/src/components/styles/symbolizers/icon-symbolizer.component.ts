import {Component, EventEmitter, Input, Output} from '@angular/core';

import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsSelectIconDialogComponent} from './select-icon-dialog.component';
import {IconSymbolizer} from 'geostyler-style';
import {SymbolizerIcon} from '../../../config.service';

@Component({
  selector: 'hs-icon-symbolizer',
  templateUrl: './icon-symbolizer.html',
})
export class HsIconSymbolizerComponent {
  @Input() symbolizer: IconSymbolizer;
  @Output() changes = new EventEmitter<void>();

  selectedIcon?: SymbolizerIcon;

  constructor(private hsDialogContainerService: HsDialogContainerService) {}

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
  emitChange() {
    this.changes.emit();
  }

  showIconSelector(): void {
    this.hsDialogContainerService.create(HsSelectIconDialogComponent, this);
  }
}
