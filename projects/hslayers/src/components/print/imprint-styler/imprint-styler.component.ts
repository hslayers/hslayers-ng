import {CANVAS_SIZES} from './../utils/position-options';
import {Component, Input} from '@angular/core';
import {ImprintObj} from './../models/imprint-object.model';

@Component({
  selector: 'hs-print-imprint-styler',
  templateUrl: './imprint-styler.component.html',
})
export class HsPrintImprintStylerComponent {
  @Input() imprintObj: ImprintObj;
  sizes = CANVAS_SIZES;

  constructor() {}
}
