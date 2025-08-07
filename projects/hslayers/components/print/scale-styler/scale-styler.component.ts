import {Component, Input, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsPrintScaleService} from '../print-scale.service';
import {SCALE_STYLING_OPTIONS} from '../constants/scale-styling-options';
import {ScaleObj} from '../types/scale-object.type';

@Component({
  selector: 'hs-print-scale-styler',
  templateUrl: './scale-styler.component.html',
  imports: [FormsModule, TranslatePipe],
})
export class HsPrintScaleStylerComponent {
  private hsPrintScaleService = inject(HsPrintScaleService);
  private hsLanguageService = inject(HsLanguageService);

  @Input() scaleObj: ScaleObj;
  stylingOptions = SCALE_STYLING_OPTIONS;

  /**
   * Triggered when scale object values have been changed
   */
  scaleObjChanged(): void {
    this.hsPrintScaleService.scaleChanged(this.scaleObj);
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
