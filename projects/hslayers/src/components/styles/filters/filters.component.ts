import {Component, Input} from '@angular/core';

import {HsFiltersService} from './filters.service';
import {HsStylerPartBaseComponent} from '../style-part-base.component';
import { FilterType } from './filter.type';

@Component({
  selector: 'hs-filters',
  templateUrl: './filters.component.html',
})
export class HsFiltersComponent extends HsStylerPartBaseComponent {
  @Input() rule;

  constructor(public hsFiltersService: HsFiltersService) {
    super();
  }

  add(type: FilterType, append: boolean): void {
    if (this.rule.filter == undefined) {
      this.rule.filter = [];
    }
    this.hsFiltersService.add(type, append, this.rule.filter);
  }

  remove(): void {
    delete this.rule.filter;
    //Trigger change detection
    this.rule = {...this.rule};
    this.emitChange();
  }
}
