import {CommonModule} from '@angular/common';
import {Component, Input, inject} from '@angular/core';
import {Filter} from 'hslayers-ng/types';
import {HsAddFilterButtonComponent} from './add-filter-button/add-filter-button.component';
import {HsComparisonFilterComponent} from './comparison-filter/comparison-filter.component';
import {HsFiltersService} from './filters.service';
import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  standalone: true,
  selector: 'hs-filter',
  templateUrl: './filter.component.html',
  imports: [
    CommonModule,
    HsComparisonFilterComponent,
    HsAddFilterButtonComponent,
    TranslateCustomPipe,
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
