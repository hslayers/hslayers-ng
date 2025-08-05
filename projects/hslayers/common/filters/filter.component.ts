import {Component, Input, inject} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {Filter} from 'hslayers-ng/types';
import {HsAddFilterButtonComponent} from './add-filter-button/add-filter-button.component';
import {HsComparisonFilterComponent} from './comparison-filter/comparison-filter.component';
import {HsFiltersService} from './filters.service';
import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';

@Component({
  selector: 'hs-filter',
  templateUrl: './filter.component.html',
  imports: [
    HsComparisonFilterComponent,
    HsAddFilterButtonComponent,
    TranslatePipe,
  ],
  styles: `
    :host {
      flex: 1 1 auto;
    }
  `,
})
export class HsFilterComponent extends HsStylerPartBaseComponent {
  @Input() filter: Filter;
  @Input() parent: Filter;

  hsFiltersService = inject(HsFiltersService);
  constructor() {
    super();
  }

  remove(): void {
    if (this.parent) {
      this.hsFiltersService.removeFilter(this.parent, this.filter);
    }
    this.emitChange();
  }
}
