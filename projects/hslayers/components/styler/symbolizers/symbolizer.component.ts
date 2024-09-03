import {Component, Input} from '@angular/core';

import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';
import {Kinds} from './symbolizer-kind.enum';

@Component({
  selector: 'hs-symbolizer',
  templateUrl: './symbolizer.component.html',
})
export class HsSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer;

  kinds = Kinds;
}
