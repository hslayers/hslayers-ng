import {Component, Input} from '@angular/core';

import {HsFiltersService} from './filters.service';
import {HsStylerPartBaseComponent} from '../style-part-base.component';
@Component({
  selector: 'hs-comparison-filter',
  templateUrl: './comparison-filter.html',
})
export class HsComparisonFilterComponent extends HsStylerPartBaseComponent {
  @Input() filter;
  @Input() parent;

  constructor(public HsFiltersService: HsFiltersService) {
    super();
  }

  remove(): void {
    this.parent.splice(this.parent.indexOf(this.filter), 1);
    this.emitChange();
  }
}
