import {CommonModule} from '@angular/common';
import {Component, Input, inject} from '@angular/core';
import {HsAddFilterButtonComponent} from './add-filter-button.component';
import {HsComparisonFilterComponent} from './comparison-filter.component';
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
})
export class HsFilterComponent extends HsStylerPartBaseComponent {
  @Input() filter: any[];
  @Input() parent: any[];

  hsFiltersService = inject(HsFiltersService);
  constructor() {
    super();
  }

  remove(): void {
    this.parent.splice(this.parent.indexOf(this.filter), 1);
    this.emitChange();
  }
}
