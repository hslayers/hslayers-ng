import {Component, Input, ViewChild} from '@angular/core';

import {FillSymbolizer, SymbolizerKind} from 'geostyler-style';

import {HsStylerPartBaseComponent} from '../../style-part-base.component';
import {Kinds} from '../symbolizer-kind.enum';

@Component({
  selector: 'hs-fill-symbolizer',
  templateUrl: './fill-symbolizer.component.html',
  styles: [
    `
      hs-symbolizer-color-picker.disabled {
        color: lightgray;
      }
    `,
  ],
})
export class HsFillSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: FillSymbolizer;
  @ViewChild('graphicFillMenu') menuRef;
  kinds = Kinds;

  addSymbolizer(attribute: string, kind: SymbolizerKind): void {
    const symbolizer = {kind, color: '#000000', opacity: 1};
    if (kind == Kinds.icon) {
      Object.assign(symbolizer, {
        offset: [0.5, 0.5],
        size: 20,
        image: 'assets/img/icons/information78.svg',
      });
    }
    if (kind == Kinds.mark) {
      Object.assign(symbolizer, {
        wellKnownName: 'circle',
        radius: 7,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeOpacity: 0.25,
        strokeWidth: 2,
      });
    }
    this.symbolizer[attribute] = symbolizer;
    this.menuRef.close();
    this.emitChange();
  }
}
