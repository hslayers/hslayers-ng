import {Component, Input} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {FillSymbolizer, MarkSymbolizer, TextSymbolizer} from 'geostyler-style';

import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';

@Component({
  selector: 'hs-symbolizer-slider',
  templateUrl: './slider.component.html',
  imports: [FormsModule],
})
export class HsSliderComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: MarkSymbolizer | FillSymbolizer | TextSymbolizer;
  @Input() attribute: string;
  @Input() label: string;
  @Input() min: number;
  @Input() max: number;
  @Input() step: number;
}
