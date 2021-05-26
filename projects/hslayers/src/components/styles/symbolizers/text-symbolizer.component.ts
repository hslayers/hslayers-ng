import {Component, EventEmitter, Input, Output} from '@angular/core';

import {TextSymbolizer} from 'geostyler-style';

@Component({
  selector: 'hs-text-symbolizer',
  templateUrl: './text-symbolizer.html',
})
export class HsTextSymbolizerComponent {
  @Input() symbolizer: TextSymbolizer;
  @Output() changes = new EventEmitter<void>();

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
  fontStyles = ['normal', 'italic', 'oblique'];
  transforms = ['none', 'uppercase', 'lowercase'];
  justifications = ['left', 'center', 'right'];
  fontWeights = ['normal', 'bold'];

  emitChange(): void {
    this.changes.emit();
  }
}
