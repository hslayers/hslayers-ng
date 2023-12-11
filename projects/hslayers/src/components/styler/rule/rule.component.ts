import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';

import {SymbolizerKind} from 'geostyler-style';

import {HsStylerPartBaseComponent} from './../style-part-base.component';
import {HsStylerService} from './../styler.service';
import {Kinds} from './../symbolizers/symbolizer-kind.enum';

@Component({
  selector: 'hs-rule',
  templateUrl: './rule.component.html',
  styleUrls: ['./../styler.component.scss'],
})
export class HsRuleComponent extends HsStylerPartBaseComponent {
  @Input() rule;
  @Output() changes = new EventEmitter<void>();
  @ViewChild('addSymMenu') menuRef;
  filtersVisible = false;
  scalesVisible = false;
  constructor(public hsStylerService: HsStylerService) {
    super();
  }
  async addSymbolizer(kind: SymbolizerKind): Promise<void> {
    const symbolizer = {kind, color: '#000'};
    if (kind === Kinds.text) {
      Object.assign(symbolizer, {size: 12, offset: [0, 0]});
    }
    if (kind === Kinds.fill) {
      Object.assign(symbolizer, {outlineColor: '#000'});
    }
    if (kind == Kinds.icon) {
      Object.assign(symbolizer, {offset: [0.5, 0.5]});
    }
    if (kind == Kinds.mark) {
      Object.assign(symbolizer, {wellKnownName: 'circle'});
    }
    if (kind == Kinds.icon) {
      Object.assign(symbolizer, {image: 'assets/img/icons/information78.svg'});
    }
    this.rule.symbolizers.push(symbolizer);
    this.menuRef.close();
    this.emitChange();
  }

  async drop(event: CdkDragDrop<any[]>): Promise<void> {
    moveItemInArray(
      this.rule.symbolizers,
      event.previousIndex,
      event.currentIndex,
    );

    this.emitChange();
  }
}
