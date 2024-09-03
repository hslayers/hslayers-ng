import * as olFormatFilter from 'ol/format/filter';
import {Component, Input, inject} from '@angular/core';
import {
  HsFiltersComponent,
  HsFiltersService,
} from 'hslayers-ng/components/styler';

@Component({
  selector: 'hs-wfs-filter',
  templateUrl: './wfs-filter.component.html',
  styles: ``,
  standalone: true,
  imports: [HsFiltersComponent],
})
export class HsWfsFilterComponent {
  @Input() rule: any;

  hsFiltersService = inject(HsFiltersService);
  constructor() {}

  parseFilters(filters: any[]): any[] {
    return filters.map((filter) => {
      switch (filter[0]) {
        case '==':
          return olFormatFilter.equalTo(filter[1], filter[2]);
        case '*=':
          return olFormatFilter.like(filter[1], filter[2]);
        case '!=':
          return olFormatFilter.notEqualTo(filter[1], filter[2]);
        case '<':
          return olFormatFilter.lessThan(filter[1], filter[2]);
        case '<=':
          return olFormatFilter.lessThanOrEqualTo(filter[1], filter[2]);
        case '>':
          return olFormatFilter.greaterThan(filter[1], filter[2]);
        case '>=':
          return olFormatFilter.greaterThanOrEqualTo(filter[1], filter[2]);
        case '&&':
          return olFormatFilter.and(...this.parseFilters(filter.slice(1)));
        case '||':
          return olFormatFilter.or(...this.parseFilters(filter.slice(1)));
        case '!':
          return olFormatFilter.not(this.parseFilters([filter[1]])[0]);
        default:
          throw new Error('Invalid filter type');
      }
    });
  }
}
