import {Component, Input} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {NgForOf} from '@angular/common';

import {CANVAS_SIZES} from '../constants/position-options';
import {HsPrintTextStylerComponent} from '../text-styler/text-styler.component';
import {ImprintObj} from '../types/imprint-object.type';
import {TranslateCustomPipe} from '../../language/translate-custom.pipe';

@Component({
  selector: 'hs-print-imprint-styler',
  templateUrl: './imprint-styler.component.html',
  standalone: true,
  imports: [
    NgForOf,
    FormsModule,
    HsPrintTextStylerComponent,
    TranslateCustomPipe,
  ],
})
export class HsPrintImprintStylerComponent {
  @Input() imprintObj: ImprintObj;
  sizes = CANVAS_SIZES;

  constructor() {}
}
