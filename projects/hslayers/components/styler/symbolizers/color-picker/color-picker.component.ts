import {Component, Input, OnInit} from '@angular/core';

import {ColorEvent} from 'ngx-color';
import {FillSymbolizer, MarkSymbolizer, TextSymbolizer} from 'geostyler-style';

import {HsColorPickerService} from './color-picker.service';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsStylerPartBaseComponent} from '../../style-part-base.component';

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
})
export class HsColorPickerComponent
  extends HsStylerPartBaseComponent
  implements OnInit {
  constructor(
    public hsColorPickerService: HsColorPickerService,
    private hsLog: HsLogService,
  ) {
    super();
  }
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
