import {Component, Input} from '@angular/core';

import {Symbolizer, SymbolizerKind} from 'geostyler-style';

import {HsStylerPartBaseComponent} from './style-part-base.component';
@Component({
  selector: 'hs-rule',
  templateUrl: './rule.html',
})
export class HsRuleComponent extends HsStylerPartBaseComponent {
  @Input() rule;

  filtersVisible = false;
  scalesVisible = false;

  addSymbolizer(kind: SymbolizerKind): void {
    const symbolizer = {kind, color: '#000'};
    if (kind == 'Text') {
      Object.assign(symbolizer, {size: 12, offset: [0, 0]});
    }
    if (kind == 'Icon') {
      Object.assign(symbolizer, {offset: [0.5, 0.5]});
    }
    this.rule.symbolizers.push(symbolizer);
  }

  removeSymbolizer(symbolizer: Symbolizer): void {
    this.rule.symbolizers.splice(this.rule.symbolizers.indexOf(symbolizer), 1);
    this.emitChange();
  }
}
