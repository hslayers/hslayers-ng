import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {HsFiltersService} from './filters.service';

@Component({
  selector: 'hs-filters',
  templateUrl: './filters.html',
})
export class HsFiltersComponent {
  @Input() rule;
  @Output() changes = new EventEmitter<void>();

  constructor(public HsFiltersService: HsFiltersService) {}

  add(kind: 'AND' | 'OR' | 'NOT' | 'COMPARE', append: boolean): void {
    if (this.rule.filter == undefined) {
      this.rule.filter = [];
    }
    this.HsFiltersService.add(kind, append, this.rule.filter);
  }

  emitChange(): void {
    this.changes.emit();
  }

  remove(): void {
    delete this.rule.filter;
    this.changes.emit();
  }
}
