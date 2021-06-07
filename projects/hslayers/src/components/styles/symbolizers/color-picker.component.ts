import {Component, Input} from '@angular/core';

import {ColorEvent} from 'ngx-color';
import {FillSymbolizer, MarkSymbolizer, TextSymbolizer} from 'geostyler-style';
import {HsStylerPartBaseComponent} from '../style-part-base.component';

@Component({
  selector: 'hs-symbolizer-color-picker',
  templateUrl: './color-picker.html',
})
export class HsColorPickerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: MarkSymbolizer | FillSymbolizer | TextSymbolizer;
  @Input() attribute: string;
  @Input() label: string;
  pickerVisible = false;

  onPick($event: ColorEvent) {
    this.symbolizer[this.attribute] = $event.color.hex;
    this.emitChange();
  }
}
