import {Component, EventEmitter, Input, Output} from '@angular/core';
import {HsFiltersService} from './filters.service';

@Component({
  selector: 'hs-filter',
  templateUrl: './filter.html',
})
export class HsFilterComponent {
  @Input() filter: any[];
  @Output() changes = new EventEmitter<void>();

  constructor(public HsFiltersService: HsFiltersService) {}

  emitChange(): void {
    this.changes.emit();
  }

  remove(filter: Array<any>): void {
    this.filter.splice(this.filter.indexOf(filter), 1);
    this.changes.emit();
  }
}
