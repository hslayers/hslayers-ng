import {Component, Input} from '@angular/core';

import {TextSymbolizer} from 'geostyler-style';

import {HsStylerPartBaseComponent} from '../../style-part-base.component';

@Component({
  selector: 'hs-text-symbolizer',
  templateUrl: './text-symbolizer.component.html',
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
