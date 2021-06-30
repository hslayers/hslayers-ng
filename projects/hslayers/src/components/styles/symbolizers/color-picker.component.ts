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
  fontColor = 'white';
  pickerVisible = false;

  onPick($event: ColorEvent): void {
    this.symbolizer[
      this.attribute
    ] = `rgba(${$event.color.rgb.r}, ${$event.color.rgb.g}, ${$event.color.rgb.b}, ${$event.color.rgb.a})`;
    this.fontColor = this.generateFontColor([
      $event.color.rgb.r,
      $event.color.rgb.g,
      $event.color.rgb.b,
    ]);
    this.emitChange();
  }

  generateFontColor(rgbColor: Array<number>): string {
    const [r, g, b] = rgbColor;
    const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    return hsp > 127.5 ? 'black' : 'white';
  }

  colorPickerStyle() {
    return {
      'background-color': this.symbolizer[this.attribute],
      'color': this.fontColor,
    };
  }
}
