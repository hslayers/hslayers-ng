import {Component, Input} from '@angular/core';

import {MarkSymbolizer} from 'geostyler-style';

import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';

@Component({
  selector: 'hs-mark-symbolizer',
  templateUrl: './mark-symbolizer.component.html',
  standalone: false,
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
