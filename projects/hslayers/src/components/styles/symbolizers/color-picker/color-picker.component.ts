import {Component, Input} from '@angular/core';

import {ColorEvent} from 'ngx-color';
import {FillSymbolizer, MarkSymbolizer, TextSymbolizer} from 'geostyler-style';

import {HsColorPickerService} from './color-picker.service';
import {HsStylerPartBaseComponent} from '../../style-part-base.component';

@Component({
  selector: 'hs-symbolizer-color-picker',
  templateUrl: './color-picker.component.html',
})
export class HsColorPickerComponent extends HsStylerPartBaseComponent {
  constructor(public hsColorPickerService: HsColorPickerService) {
    super();
  }
  @Input() symbolizer: MarkSymbolizer | FillSymbolizer | TextSymbolizer;
  @Input() attribute: string;
  @Input() opacityAttribute?: string;
  @Input() label: string;
  fontColor = 'white';
  pickerVisible = false;

  onPick($event: ColorEvent): void {
    this.symbolizer[this.attribute] = $event.color.hex;
    if (this.opacityAttribute) {
      this.symbolizer[this.opacityAttribute] = $event.color.rgb.a;
    }
    this.fontColor = this.hsColorPickerService.generateFontColor([
      $event.color.rgb.r,
      $event.color.rgb.g,
      $event.color.rgb.b,
    ]);
    this.emitChange();
  }

  inputChanged() {
    try {
      const rgb = this.hsColorPickerService.hex2Rgb(
        this.symbolizer[this.attribute]
      );
      this.fontColor = this.hsColorPickerService.generateFontColor([
        rgb.r,
        rgb.g,
        rgb.b,
      ]);
      this.emitChange();
    } catch (ex) {
      console.error(ex);
    }
  }

  colorPickerStyle(): string {
    return this.hsColorPickerService.colorPickerStyle(
      this.symbolizer[this.attribute],
      this.fontColor
    );
  }
}
