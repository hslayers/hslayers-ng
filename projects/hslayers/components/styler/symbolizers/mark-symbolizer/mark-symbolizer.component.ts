import {Component, Input} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {MarkSymbolizer} from 'geostyler-style';

import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';
import {HsColorPickerComponent} from '../color-picker/color-picker.component';
import {HsSliderComponent} from '../slider/slider.component';

@Component({
  selector: 'hs-mark-symbolizer',
  templateUrl: './mark-symbolizer.component.html',
  imports: [
    FormsModule,
    NgClass,
    HsColorPickerComponent,
    HsSliderComponent,
    TranslatePipe,
  ],
})
export class HsMarkSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: MarkSymbolizer;
  @Input() submenu = false;
  wellKnownNames = [
    'circle',
    'square',
    'triangle',
    'star',
    'cross',
    'x',
    'shape://vertline',
    'shape://horline',
    'shape://slash',
    'shape://backslash',
    'shape://dot',
    'shape://plus',
    'shape://times',
    'shape://oarrow',
    'shape://carrow',
  ];
  fillColorPickerVisible = false;
  strokeColorPickerVisible = false;
}
