import {Component, Input} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {CANVAS_SIZES} from '../constants/position-options';
import {HsPrintTextStylerComponent} from '../text-styler/text-styler.component';
import {ImprintObj} from '../types/imprint-object.type';

@Component({
  selector: 'hs-print-imprint-styler',
  templateUrl: './imprint-styler.component.html',
  imports: [FormsModule, HsPrintTextStylerComponent, TranslatePipe],
})
export class HsPrintImprintStylerComponent {
  @Input() imprintObj: ImprintObj;
  sizes = CANVAS_SIZES;

  constructor() {}
}
