import {Component, Input, OnInit, inject} from '@angular/core';

import {ColorEvent} from 'ngx-color';
import {FillSymbolizer, MarkSymbolizer, TextSymbolizer} from 'geostyler-style';

import {HsColorPickerService} from './color-picker.service';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';

@Component({
  selector: 'hs-symbolizer-color-picker',
  templateUrl: './color-picker.component.html',
  styles: [
    `
      :host.disabled input.form-control {
        background-color: lightgray !important;
        opacity: 0.5;
      }
    `,
  ],
  standalone: false,
})
export class HsColorPickerComponent
  extends HsStylerPartBaseComponent
  implements OnInit
{
  hsColorPickerService = inject(HsColorPickerService);
  private hsLog = inject(HsLogService);

  @Input() symbolizer: MarkSymbolizer | FillSymbolizer | TextSymbolizer;
  @Input() attribute: string;
  @Input() opacityAttribute?: string;
  @Input() label: string;
  fontColor = 'white';
  pickerVisible = false;

  ngOnInit(): void {
    const rgb = this.hsColorPickerService.hex2Rgb(
      this.symbolizer[this.attribute],
    );
    this.fontColor = this.hsColorPickerService.generateFontColor([
      rgb.r,
      rgb.g,
      rgb.b,
    ]);
  }

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
        this.symbolizer[this.attribute],
      );
      this.fontColor = this.hsColorPickerService.generateFontColor([
        rgb.r,
        rgb.g,
        rgb.b,
      ]);
      this.emitChange();
    } catch (ex) {
      this.hsLog.error(ex);
    }
  }

  colorPickerStyle(): string {
    return this.hsColorPickerService.colorPickerStyle(
      this.symbolizer[this.attribute],
      this.fontColor,
    );
  }
}
