import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {Rule} from 'geostyler-style';

import {FilterType} from './filter.type';

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

  activeTab: FilterType;
  readonly filterOptions: FilterType[] = ['COMPARE', 'AND', 'OR', 'NOT'];
  emitClick(type: FilterType): void {
    this.clicks.emit({type});
    this.setActiveTab(type);
  }

  setActiveTab(type: FilterType) {
    this.activeTab = this.rule?.filter ? type : undefined;
  }
}
