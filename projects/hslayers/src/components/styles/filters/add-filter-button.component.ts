import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {Rule} from 'geostyler-style';

import {filterType} from './filters.component';

@Component({
  selector: 'hs-add-filter-button',
  templateUrl: './add-filter-button.component.html',
})
export class HsAddFilterButtonComponent implements OnChanges {
  @Output() clicks = new EventEmitter();
  @Input() rule?: Rule;

  /**
   * Update UI on filter removal
   */
  ngOnChanges() {
    this.setActiveTab(this.activeTab);
  }

  activeTab: filterType;
  readonly filterOptions: filterType[] = ['AND', 'OR', 'NOT', 'COMPARE'];
  emitClick(type: filterType): void {
    this.clicks.emit({type});
    this.setActiveTab(type);
  }

  setActiveTab(type: filterType) {
    this.activeTab = this.rule?.filter ? type : undefined;
  }
}
