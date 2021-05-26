import {Component, EventEmitter, Input, Output} from '@angular/core';

import {FillSymbolizer, MarkSymbolizer, TextSymbolizer} from 'geostyler-style';

@Component({
  selector: 'hs-symbolizer-slider',
  templateUrl: './slider.html',
})
export class HsSliderComponent {
  @Input() symbolizer: MarkSymbolizer | FillSymbolizer | TextSymbolizer;
  @Input() attribute: string;
  @Input() label: string;
  @Input() min: number;
  @Input() max: number;
  @Input() step: number;
  @Output() changes = new EventEmitter<void>();

  emitChange() {
    this.changes.emit();
  }
}
