import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';

import {SymbolizerKind} from 'geostyler-style';

import {HsStylerPartBaseComponent} from '../style-part-base.component';
import {HsStylerService} from 'hslayers-ng/shared/styler';
import {Kinds} from '../symbolizers/symbolizer-kind.enum';

@Component({
  selector: 'hs-rule',
  templateUrl: './rule.component.html',
  styleUrls: ['../styler.component.scss'],
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
    const symbolizer = {kind, color: '#000000'};
    if (kind === Kinds.text) {
      Object.assign(symbolizer, {
        size: 12,
        offset: [0, 0],
        font: ['Arial'],
        fontStyle: 'normal',
        fontWeight: 'normal',
        rotation: 0,
      });
    }
    if (kind === Kinds.fill) {
      Object.assign(symbolizer, {
        outlineColor: '#ffffff',
        fillOpacity: 1,
        outlineOpacity: 0.5,
        outlineWidth: 2,
      });
    }
    if (kind == Kinds.icon) {
      Object.assign(symbolizer, {
        offset: [0.5, 0.5],
        opacity: 1,
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
    if (kind == Kinds.line) {
      Object.assign(symbolizer, {
        width: 2,
        join: 'round',
        cap: 'round',
      });
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
