import {Component, EventEmitter, Input, Output} from '@angular/core';

import {MarkSymbolizer} from 'geostyler-style';

@Component({
  selector: 'hs-mark-symbolizer',
  templateUrl: './mark-symbolizer.html',
})
export class HsMarkSymbolizerComponent {
  @Input() symbolizer: MarkSymbolizer;
  @Output() changes = new EventEmitter<void>();

  wellKnownNames = [
    'circle',
    'square',
    'triangle',
    'star',
    'cross',
    'x',
    'shape://vertline',
    'shape://horline',
    'shape://slash',
    'shape://backslash',
    'shape://dot',
    'shape://plus',
    'shape://times',
    'shape://oarrow',
    'shape://carrow',
  ];
  fillColorPickerVisible = false;
  strokeColorPickerVisible = false;

  emitChange() {
    this.changes.emit();
  }
}
