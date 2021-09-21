import {Component, Input} from '@angular/core';

import {HsFiltersService} from './filters.service';
import {HsStylerPartBaseComponent} from '../style-part-base.component';

@Component({
  selector: 'hs-filter',
  templateUrl: './filter.component.html',
})
export class HsFilterComponent extends HsStylerPartBaseComponent {
  @Input() filter: any[];
  @Input() parent: any[];

  constructor(public hsFiltersService: HsFiltersService) {
    super();
  }

  remove(): void {
    this.parent.splice(this.parent.indexOf(this.filter), 1);
    this.emitChange();
  }
}
