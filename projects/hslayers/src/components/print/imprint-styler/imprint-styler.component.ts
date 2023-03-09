import {CANVAS_SIZES} from '../constants/position-options';
import {Component, Input} from '@angular/core';
import {ImprintObj} from '../types/imprint-object.type';

@Component({
  selector: 'hs-print-imprint-styler',
  templateUrl: './imprint-styler.component.html',
})
export class HsPrintImprintStylerComponent {
  @Input() imprintObj: ImprintObj;
  
  sizes = CANVAS_SIZES;

  constructor() {}
}
