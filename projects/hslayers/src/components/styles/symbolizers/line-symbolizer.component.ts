import {Component, EventEmitter, Input, Output} from '@angular/core';

import {LineSymbolizer, SymbolizerKind} from 'geostyler-style';

@Component({
  selector: 'hs-line-symbolizer',
  templateUrl: './line-symbolizer.html',
})
export class HsLineSymbolizerComponent {
  @Input() symbolizer: LineSymbolizer;
  @Output() changes = new EventEmitter<void>();

  caps = ['butt', 'round', 'square'];
  joins = ['bevel', 'round', 'miter'];

  addSymbolizer(attribute: string, kind: SymbolizerKind): void {
    this.symbolizer[attribute] = {kind};
  }

  emitChange(): void {
    this.changes.emit();
  }
}
