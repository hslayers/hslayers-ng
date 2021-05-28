import {Component, EventEmitter, Input, Output} from '@angular/core';

import {HsFiltersService} from './filters.service';

@Component({
  selector: 'hs-comparison-filter',
  templateUrl: './comparison-filter.html',
})
export class HsComparisonFilterComponent {
  @Input() filter;
  @Input() parent;
  @Output() changes = new EventEmitter<void>();

  constructor(public HsFiltersService: HsFiltersService) {}

  emitChange(): void {
    this.changes.emit();
  }

  remove(): void {
    this.parent.splice(this.parent.indexOf(this.filter), 1);
    this.changes.emit();
  }
}
