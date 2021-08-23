import {Component, Input} from '@angular/core';

import {FillSymbolizer, SymbolizerKind} from 'geostyler-style';

import {HsStylerPartBaseComponent} from '../style-part-base.component';

@Component({
  selector: 'hs-fill-symbolizer',
  templateUrl: './fill-symbolizer.html',
})
export class HsFillSymbolizerComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: FillSymbolizer;

  addSymbolizer(attribute: string, kind: SymbolizerKind): void {
    this.symbolizer[attribute] = {kind};
  }

  opacityFix(): void {
    this.symbolizer.fillOpacity = this.symbolizer.opacity;
  }
}
