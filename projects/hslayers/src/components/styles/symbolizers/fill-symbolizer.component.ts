import {Component, EventEmitter, Input, Output} from '@angular/core';

import {FillSymbolizer, SymbolizerKind} from 'geostyler-style';

@Component({
  selector: 'hs-fill-symbolizer',
  templateUrl: './fill-symbolizer.html',
})
export class HsFillSymbolizerComponent {
  @Input() symbolizer: FillSymbolizer;
  @Output() changes = new EventEmitter<void>();

  emitChange(): void {
    this.changes.emit();
  }

  addSymbolizer(attribute: string, kind: SymbolizerKind): void {
    this.symbolizer[attribute] = {kind};
  }
}
