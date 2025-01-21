import {Component, Input, inject, viewChild} from '@angular/core';

import {FilterType} from 'hslayers-ng/types';
import {HsAddFilterButtonComponent} from './add-filter-button/add-filter-button.component';
import {HsComparisonFilterComponent} from './comparison-filter/comparison-filter.component';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsFilterComponent} from './filter.component';
import {HsFiltersService} from './filters.service';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-filters',
  templateUrl: './filters.component.html',
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
  hsEventBusService = inject(HsEventBusService);

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
    this.hsEventBusService.resetWfsFilter.next();
    this.emitChange();
  }
}
