import {Component, EventEmitter, Input, Output} from '@angular/core';

import {FillSymbolizer} from 'geostyler-style';

@Component({
  selector: 'hs-fill-symbolizer',
  templateUrl: './fill-symbolizer.html',
})
export class HsFillSymbolizerComponent {
  @Input() symbolizer: FillSymbolizer;
  @Output() changes = new EventEmitter<void>();

  emitChange() {
    this.changes.emit();
  }
}
