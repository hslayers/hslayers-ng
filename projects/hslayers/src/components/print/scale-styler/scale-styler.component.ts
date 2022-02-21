import {Component, Input} from '@angular/core';

import {HsLanguageService} from './../../language/language.service';
import {HsPrintScaleService} from '../print-scale.service';
import {SCALE_STYLING_OPTIONS} from '../utils/scale-styling-options';
import {ScaleObj} from '../models/scale-object.model';

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
    this.hsPrintScaleService.scaleChanged(this.scaleObj);
  }

  /**
   * Get translation for the value string
   */
  getTranslation(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }
}
