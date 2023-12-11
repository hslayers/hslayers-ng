import {Component, Input} from '@angular/core';

import {HsStylerPartBaseComponent} from '../style-part-base.component';
import {Kinds} from './symbolizer-kind.enum';

@Component({
  selector: 'hs-symbolizer',
  templateUrl: './symbolizer.component.html',
})
export class HsSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer;

  kinds = Kinds;
}
