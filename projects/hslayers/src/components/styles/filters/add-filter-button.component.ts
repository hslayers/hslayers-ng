import {Component, EventEmitter, Output} from '@angular/core';
import {filterType} from './filters.component';

@Component({
  selector: 'hs-add-filter-button',
  templateUrl: './add-filter-button.component.html',
})
export class HsAddFilterButtonComponent {
  @Output() clicks = new EventEmitter();

  readonly filterOptions: filterType[] = ['AND', 'OR', 'NOT', 'COMPARE'];
  emitClick(type: filterType): void {
    this.clicks.emit({type});
  }
}
