import {Component, Input} from '@angular/core';

import {HsFiltersService} from './filters.service';
import {HsStylerPartBaseComponent} from '../style-part-base.component';

export type filterType = 'AND' | 'OR' | 'NOT' | 'COMPARE';

@Component({
  selector: 'hs-filters',
  templateUrl: './filters.component.html',
})
export class HsFiltersComponent extends HsStylerPartBaseComponent {
  @Input() rule;

  constructor(public hsFiltersService: HsFiltersService) {
    super();
  }

  add(type: filterType, append: boolean): void {
    if (this.rule.filter == undefined) {
      this.rule.filter = [];
    }
    this.hsFiltersService.add(type, append, this.rule.filter);
  }

  remove(): void {
    delete this.rule.filter;
    this.emitChange();
  }
}
