import {Component, Input} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {TextSymbolizer} from 'geostyler-style';

import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';
import {HsColorPickerComponent} from '../color-picker/color-picker.component';
import {HsSliderComponent} from '../slider/slider.component';

@Component({
  selector: 'hs-text-symbolizer',
  templateUrl: './text-symbolizer.component.html',
  imports: [
    FormsModule,
    HsColorPickerComponent,
    HsSliderComponent,
    TranslatePipe,
  ],
})
export class HsTextSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: TextSymbolizer;

  anchors = [
    'center',
    'left',
    'right',
    'top',
    'bottom',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ];
  fonts = [
    'Arial',
    'Verdana',
    'Sans-serif',
    'Courier New',
    'Lucida Console',
    'Monospace',
    'Times New Roman',
    'Georgia',
    'Serif',
  ];
  fontStyles = ['normal', 'italic', 'bold'];
  transforms = ['none', 'uppercase', 'lowercase'];
  justifications = ['left', 'center', 'right'];
  fontWeights = ['normal', 'bold'];
}
