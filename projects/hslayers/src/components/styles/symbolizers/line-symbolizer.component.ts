import {Component, EventEmitter, Input, Output} from '@angular/core';

import {LineSymbolizer} from 'geostyler-style';

@Component({
  selector: 'hs-line-symbolizer',
  templateUrl: './line-symbolizer.html',
})
export class HsLineSymbolizerComponent {
  @Input() symbolizer: LineSymbolizer;
  @Output() changes = new EventEmitter<void>();

  caps = ['butt', 'round', 'square'];
  joins = ['bevel', 'round', 'miter'];

  emitChange() {
    this.changes.emit();
  }
}
