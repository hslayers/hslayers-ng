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
}
