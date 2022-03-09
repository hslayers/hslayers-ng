import {Component, Input} from '@angular/core';

import {ColorEvent} from 'ngx-color';

import {CANVAS_SIZES, POSITION_OPTIONS} from '../constants/position-options';
import {HsColorPickerService} from '../../styles/symbolizers/color-picker/color-picker.service';
import {HsLanguageService} from './../../language/language.service';
import {LegendObj} from '../types/legend-object.type';

@Component({
  selector: 'hs-print-legend-styler',
  templateUrl: './legend-styler.component.html',
})
export class HsPrintLegendStylerComponent {
  bcColor: string;
  fillPickerVisible = false;
  positionOptions = POSITION_OPTIONS;
  legendWidths = CANVAS_SIZES;
  @Input() legendObj: LegendObj;
  @Input() app = 'default';

  constructor(
    public hsLanguageService: HsLanguageService,
    private hsColorPickerService: HsColorPickerService
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
      this.bcColor
    );
  }

  /**
   * Get translation for the value string
   */
  getTranslation(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(
      module,
      text,
      undefined,
      this.app
    );
  }
}
