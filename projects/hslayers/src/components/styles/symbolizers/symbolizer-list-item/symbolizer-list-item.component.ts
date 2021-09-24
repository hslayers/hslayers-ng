import {Component, Input} from '@angular/core';

import {Rule, Symbolizer} from 'geostyler-style';

import {HsStylerPartBaseComponent} from '../../style-part-base.component';
import {HsStylerService} from '../../styler.service';
import {Kinds} from '../symbolizer-kind.enum';

@Component({
  selector: 'hs-symbolizer-list-item',
  templateUrl: 'symbolizer-list-item.component.html',
  styleUrls: ['../../styler.component.scss'],
})
export class HsSymbolizerListItemComponent extends HsStylerPartBaseComponent {
  @Input() symbolizer: Symbolizer;
  @Input() rule: Rule;
  symbolizerVisible = false;
  constructor(public hsStylerService: HsStylerService) {
    super();
  }

  getSymbolizerName(symbolizer: any): string {
    switch (symbolizer.kind) {
      case Kinds.fill:
        return 'STYLER.fillSymbolizer';
      case Kinds.icon:
        return 'STYLER.iconSymbolizer';
      case Kinds.line:
        return 'STYLER.lineSymbolizer';
      case Kinds.text:
        return 'STYLER.textSymbolizer';
      case Kinds.mark:
        return 'STYLER.markSymbolizer';
      default:
        return 'STYLER.unknownSymbolizer';
    }
  }

  removeSymbolizer(symbolizer: Symbolizer): void {
    this.rule.symbolizers.splice(this.rule.symbolizers.indexOf(symbolizer), 1);
    this.emitChange();
  }

  setSymbolizerVisible(): void {
    this.symbolizerVisible = !this.symbolizerVisible;
    this.hsStylerService.canReorder = false;
  }
}
