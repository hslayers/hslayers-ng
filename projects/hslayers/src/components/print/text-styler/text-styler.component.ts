import {Component, Input} from '@angular/core';

import {ColorEvent} from 'ngx-color';

import {ColorSketchModule} from 'ngx-color/sketch';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsColorPickerService} from '../../styler/symbolizers/color-picker/color-picker.service';
import {HsLanguageService} from '../../language/language.service';
import {POSITION_OPTIONS} from '../constants/position-options';
import {TEXT_STYLING_OPTIONS} from '../constants/text-styling-options';
import {TextStyle} from '../types/text-style.type';
import {TranslateCustomPipe} from '../../language/translate-custom.pipe';

export enum ColorPickers {
  Fill = 'fill',
  Background = 'background',
}
@Component({
  selector: 'hs-print-text-styler',
  templateUrl: './text-styler.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateCustomPipe, ColorSketchModule],
})
export class HsPrintTextStylerComponent {
  @Input() textStyle: TextStyle;
  @Input() objectName: string;
  fillPickerVisible = false;
  bcPickerVisible = false;
  textColor = 'white';
  backgroundColor = 'white';
  stylingOptions = TEXT_STYLING_OPTIONS;
  positionOptions = POSITION_OPTIONS;
  constructor(
    private hsColorPickerService: HsColorPickerService,
    private hsLanguageService: HsLanguageService,
  ) {}

  /**
   * Triggered when color picker value has been selected
   * @param $event - ColorEvent
   * @param type - color picker type selected
   */
  onPick($event: ColorEvent, type: 'fill' | 'background'): void {
    const hex = $event.color.hex;
    const hsp = this.hsColorPickerService.generateFontColor([
      $event.color.rgb.r,
      $event.color.rgb.g,
      $event.color.rgb.b,
    ]);
    switch (type) {
      case ColorPickers.Fill:
        this.textStyle.textColor = hex;
        this.textColor = hsp;
        break;
      case ColorPickers.Background:
        this.textStyle.bcColor = hex;
        this.backgroundColor = hsp;
        break;
      default:
        return;
    }
  }

  /**
   * Get color picker style values for DOM styling
   * @param type - color picker type selected
   */
  getColorPickerStyle(type: 'fill' | 'background'): any {
    switch (type) {
      case ColorPickers.Fill:
        return this.hsColorPickerService.colorPickerStyle(
          this.textStyle.textColor,
          this.textColor,
        );

      case ColorPickers.Background:
        return this.hsColorPickerService.colorPickerStyle(
          this.textStyle.bcColor,
          this.backgroundColor,
        );
      default:
        return;
    }
  }

  /**
   * Set color picker visibility
   * @param type - color picker type selected
   */
  setColorPickerVisible(type: 'fill' | 'background'): void {
    switch (type) {
      case ColorPickers.Fill:
        this.fillPickerVisible = !this.fillPickerVisible;
        this.bcPickerVisible = false;
        break;
      case ColorPickers.Background:
        this.bcPickerVisible = !this.bcPickerVisible;
        this.fillPickerVisible = false;
        break;
      default:
        return;
    }
  }

  /**
   * Get translation for the value string
   * @param module - Translation module
   * @param text - Text to translate
   */
  getTranslation(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(
      module,
      text,
      undefined,
    );
  }
}
