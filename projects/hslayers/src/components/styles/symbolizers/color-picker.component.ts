import {Component, EventEmitter, Input, Output} from '@angular/core';

import {ColorEvent} from 'ngx-color';
import {FillSymbolizer, MarkSymbolizer, TextSymbolizer} from 'geostyler-style';

@Component({
  selector: 'hs-symbolizer-color-picker',
  templateUrl: './color-picker.html',
})
export class HsColorPickerComponent {
  @Input() symbolizer: MarkSymbolizer | FillSymbolizer | TextSymbolizer;
  @Input() attribute: string;
  @Input() label: string;
  @Output() changes = new EventEmitter<void>();

  pickerVisible = false;

  onPick($event: ColorEvent) {
    this.symbolizer[this.attribute] = $event.color.hex;
    this.emitChange();
  }

  emitChange() {
    this.changes.emit();
  }
}
