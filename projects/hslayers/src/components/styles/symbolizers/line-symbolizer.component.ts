import {Component, Input} from '@angular/core';

import {LineSymbolizer, SymbolizerKind} from 'geostyler-style';

import {HsStylerPartBaseComponent} from '../style-part-base.component';

@Component({
  selector: 'hs-line-symbolizer',
  templateUrl: './line-symbolizer.html',
})
export class HsLineSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: LineSymbolizer;

  caps = ['butt', 'round', 'square'];
  joins = ['bevel', 'round', 'miter'];

  addSymbolizer(attribute: string, kind: SymbolizerKind): void {
    this.symbolizer[attribute] = {kind};
  }

  addDashItem(): void {
    if (!this.symbolizer.dasharray) {
      this.symbolizer.dasharray = [1];
    } else {
      this.symbolizer.dasharray.push(1);
    }
  }

  removeDashItem(): void {
    if (this.symbolizer.dasharray.length > 0) {
      this.symbolizer.dasharray.length--;
    }
  }
}
