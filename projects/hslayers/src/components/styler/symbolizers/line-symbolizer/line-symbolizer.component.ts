import {Component, Input, ViewChild} from '@angular/core';

import {LineSymbolizer, SymbolizerKind} from 'geostyler-style';

import {HsStylerPartBaseComponent} from '../../style-part-base.component';
import {Kinds} from '../symbolizer-kind.enum';

@Component({
  selector: 'hs-line-symbolizer',
  templateUrl: './line-symbolizer.component.html',
})
export class HsLineSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: LineSymbolizer;
  @ViewChild('graphicLineMenu') lineMenuRef;
  @ViewChild('graphicStrokeMenu') strokeMenuRef;
  caps = ['butt', 'round', 'square'];
  joins = ['bevel', 'round', 'miter'];
  kinds = Kinds;

  addSymbolizer(attribute: string, kind: SymbolizerKind): void {
    this.symbolizer[attribute] = {kind};
    this.lineMenuRef.close();
    this.strokeMenuRef.close();
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
