import {Component, Input} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {HsFillSymbolizerComponent} from './fill-symbolizer/fill-symbolizer.component';
import {HsIconSymbolizerComponent} from './icon-symbolizer/icon-symbolizer.component';
import {HsLineSymbolizerComponent} from './line-symbolizer/line-symbolizer.component';
import {HsMarkSymbolizerComponent} from './mark-symbolizer/mark-symbolizer.component';
import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';
import {HsTextSymbolizerComponent} from './text-symbolizer/text-symbolizer.component';
import {Kinds} from './symbolizer-kind.enum';

@Component({
  selector: 'hs-symbolizer',
  templateUrl: './symbolizer.component.html',
  imports: [
    FormsModule,
    HsFillSymbolizerComponent,
    HsLineSymbolizerComponent,
    HsMarkSymbolizerComponent,
    HsIconSymbolizerComponent,
    HsTextSymbolizerComponent,
  ],
})
export class HsSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer;

  kinds = Kinds;
}
