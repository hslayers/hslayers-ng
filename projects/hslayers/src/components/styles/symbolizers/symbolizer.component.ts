import {Component, EventEmitter, Input, Output} from '@angular/core';

import {HsStylerPartBaseComponent} from '../style-part-base.component';

@Component({
  selector: 'hs-symbolizer',
  templateUrl: './symbolizer.html',
})
export class HsSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer;
  @Output() remove = new EventEmitter<void>();

  kinds = ['Fill', 'Icon', 'Line', 'Text', 'Mark']; // | "Raster"

  removeSymbolizer(): void {
    this.remove.emit();
  }
}
