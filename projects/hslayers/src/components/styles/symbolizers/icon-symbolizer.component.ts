import {Component, EventEmitter, Input, Output} from '@angular/core';

import {IconSymbolizer} from 'geostyler-style';

@Component({
  selector: 'hs-icon-symbolizer',
  templateUrl: './icon-symbolizer.html',
})
export class HsIconSymbolizerComponent {
  @Input() symbolizer: IconSymbolizer;
  @Output() changes = new EventEmitter<void>();

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
}
