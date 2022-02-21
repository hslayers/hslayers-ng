import {Component, Input} from '@angular/core';

import {ColorEvent} from 'ngx-color';

import {HsColorPickerService} from '../../styles/symbolizers/color-picker/color-picker.service';
import {HsLanguageService} from '../../language/language.service';
import {POSITION_OPTIONS} from '../utils/position-options';
import {TEXT_STYLING_OPTIONS} from '../utils/text-styling-options';
import {TextStyle} from '../models/text-style.model';

export enum TextDrawTypes {
  Fill = 'fill',
  Stroke = 'stroke',
}
@Component({
  selector: 'hs-print-text-styler',
  templateUrl: './text-styler.component.html',
})
export class HsPrintTextStylerComponent {
  @Input() textStyle: TextStyle;
  fillPickerVisible = false;
  strokePickerVisible = false;
  fillColor = 'white';
  strokeColor = 'white';
  stylingOptions = TEXT_STYLING_OPTIONS;
  positionOptions = POSITION_OPTIONS;
  constructor(
    private hsColorPickerService: HsColorPickerService,
    private hsLanguageService: HsLanguageService
  ) {}

  /**
   * Triggered when color picker value has been selected
   * @param $event - ColorEvent
   * @param type - color picker type selected
   */
  onPick($event: ColorEvent, type: 'fill' | 'stroke'): void {
    const hex = $event.color.hex;
    const hsp = this.hsColorPickerService.generateFontColor([
      $event.color.rgb.r,
      $event.color.rgb.g,
      $event.color.rgb.b,
    ]);
    switch (type) {
      case TextDrawTypes.Fill:
        this.textStyle.fillColor = hex;
        this.fillColor = hsp;
        break;
      case TextDrawTypes.Stroke:
        this.textStyle.strokeColor = hex;
        this.strokeColor = hsp;
        break;
      default:
        return;
    }
  }

  /**
   * Get color picker style values for DOM styling
   * @param type - color picker type selected
   */
  getColorPickerStyle(type: 'fill' | 'stroke'): any {
    switch (type) {
      case TextDrawTypes.Fill:
        return this.hsColorPickerService.colorPickerStyle(
          this.textStyle.fillColor,
          this.fillColor
        );

      case TextDrawTypes.Stroke:
        return this.hsColorPickerService.colorPickerStyle(
          this.textStyle.strokeColor,
          this.strokeColor
        );
      default:
        return;
    }
  }

  /**
   * Set color picker visibility
   * @param type - color picker type selected
   */
  setColorPickerVisible(type: 'fill' | 'stroke'): void {
    switch (type) {
      case TextDrawTypes.Fill:
        this.fillPickerVisible = !this.fillPickerVisible;
        this.strokePickerVisible = false;
        break;
      case TextDrawTypes.Stroke:
        this.strokePickerVisible = !this.strokePickerVisible;
        this.fillPickerVisible = false;
        break;
      default:
        return;
    }
  }

  /**
   * Get translation for the value string
   */
  getTranslation(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }
}
