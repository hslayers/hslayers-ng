import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {Rule} from 'geostyler-style';

import {FilterType} from './filter.type';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-add-filter-button',
  templateUrl: './add-filter-button.component.html',
  standalone: true,
  imports: [TranslateCustomPipe, NgbDropdownModule],
})
export class HsAddFilterButtonComponent implements OnChanges {
  @Output() clicks = new EventEmitter();
  @Input() rule?: Rule;

  /**
   * Update UI on filter removal
   */
  ngOnChanges() {
    this.setActiveTab(undefined);
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
