import {Component, Input} from '@angular/core';

import {HsLanguageService} from './../../language/language.service';
import {HsPrintScaleService} from '../print-scale.service';
import {SCALE_STYLING_OPTIONS} from '../constants/scale-styling-options';
import {ScaleObj} from '../types/scale-object.type';

@Component({
  selector: 'hs-print-scale-styler',
  templateUrl: './scale-styler.component.html',
})
export class HsPrintScaleStylerComponent {
  @Input() scaleObj: ScaleObj;
  
  stylingOptions = SCALE_STYLING_OPTIONS;

  constructor(
    private hsPrintScaleService: HsPrintScaleService,
    private hsLanguageService: HsLanguageService
  ) {}

  /**
   * Triggered when scale object values have been changed
   */
  scaleObjChanged(): void {
    this.hsPrintScaleService.scaleChanged(this.scaleObj, );
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
