import {Component, Input} from '@angular/core';

import {FillSymbolizer, MarkSymbolizer, TextSymbolizer} from 'geostyler-style';

import {HsStylerPartBaseComponent} from '../../style-part-base.component';

@Component({
  selector: 'hs-symbolizer-slider',
  templateUrl: './slider.component.html',
})
export class HsSliderComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: MarkSymbolizer | FillSymbolizer | TextSymbolizer;
  @Input() attribute: string;
  @Input() label: string;
  @Input() min: number;
  @Input() max: number;
  @Input() step: number;
}
