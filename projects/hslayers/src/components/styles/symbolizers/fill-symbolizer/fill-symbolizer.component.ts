import {Component, Input, ViewChild} from '@angular/core';

import {FillSymbolizer, SymbolizerKind} from 'geostyler-style';

import {HsStylerPartBaseComponent} from '../../style-part-base.component';
import {Kinds} from '../symbolizer-kind.enum';

@Component({
  selector: 'hs-fill-symbolizer',
  templateUrl: './fill-symbolizer.component.html',
})
export class HsFillSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: FillSymbolizer;
  @ViewChild('graphicFillMenu') menuRef;
  kinds = Kinds;

  addSymbolizer(attribute: string, kind: SymbolizerKind): void {
    this.symbolizer[attribute] = {kind};
    this.menuRef.close();
  }

  opacityFix(): void {
    this.symbolizer.fillOpacity = this.symbolizer.opacity;
  }
}
