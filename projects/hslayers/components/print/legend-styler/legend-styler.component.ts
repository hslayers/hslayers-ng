import {CommonModule} from '@angular/common';
import {Component, Input} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {ColorEvent} from 'ngx-color';
import {ColorSketchModule} from 'ngx-color/sketch';

import {CANVAS_SIZES, POSITION_OPTIONS} from '../constants/position-options';
import {HsColorPickerService} from '../../styler/symbolizers/color-picker/color-picker.service';
import {HsLanguageService} from 'hslayers-ng/components/language';
import {LegendObj} from '../types/legend-object.type';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';

@Component({
  selector: 'hs-print-legend-styler',
  templateUrl: './legend-styler.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateCustomPipe, ColorSketchModule],
})
export class HsPrintLegendStylerComponent {
  bcColor: string;
  fillPickerVisible = false;
  positionOptions = POSITION_OPTIONS;
  legendWidths = CANVAS_SIZES;
  @Input() legendObj: LegendObj;

  constructor(
    public hsLanguageService: HsLanguageService,
    private hsColorPickerService: HsColorPickerService,
  ) {}

  /**
   * Triggered when color picker value has been selected
   * @param $event - ColorEvent
   */
  onPick($event: ColorEvent): void {
    const hex = $event.color.hex;
    const hsp = this.hsColorPickerService.generateFontColor([
      $event.color.rgb.r,
      $event.color.rgb.g,
      $event.color.rgb.b,
    ]);
    this.legendObj.bcColor = hex;
    this.bcColor = hsp;
  }

  /**
   * Get color picker style values for DOM styling
   */
  getColorPickerStyle(): any {
    return this.hsColorPickerService.colorPickerStyle(
      this.legendObj.bcColor,
      this.bcColor,
    );
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
