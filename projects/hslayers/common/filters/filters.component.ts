import {Component, ElementRef, Input, inject, viewChild} from '@angular/core';

import {FilterType} from './filter.type';
import {HsAddFilterButtonComponent} from './add-filter-button.component';
import {HsComparisonFilterComponent} from './comparison-filter.component';
import {HsFilterComponent} from './filter.component';
import {HsFiltersService} from './filters.service';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-filters',
  templateUrl: './filters.component.html',
  standalone: true,
  imports: [
    HsAddFilterButtonComponent,
    TranslateCustomPipe,
    HsFilterComponent,
    HsComparisonFilterComponent,
  ],
})
export class HsFiltersComponent extends HsStylerPartBaseComponent {
  @Input({required: true}) rule: any;
  @Input({required: true}) set selectedLayer(layer: HsLayerDescriptor) {
    this.hsFiltersService.setSelectedLayer(layer);
  }
  addFilterButton = viewChild<HsAddFilterButtonComponent>('addFilterButton');

  hsFiltersService = inject(HsFiltersService);
  constructor() {
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
    this.addFilterButton().setActiveTab(undefined);
    this.emitChange();
  }
}
