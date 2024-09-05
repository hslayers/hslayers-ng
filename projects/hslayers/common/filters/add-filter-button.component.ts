import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
} from '@angular/core';
import {Rule} from 'geostyler-style';

import {
  ComparisonOperatorType,
  FilterType,
  LogicalOperatorType,
} from './filter.type';
import {HsFiltersService} from './filters.service';
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

  hsFiltersService = inject(HsFiltersService);

  /**
   * Update UI on filter removal
   */
  ngOnChanges() {
    this.setActiveTab(undefined);
  }

  activeTab: FilterType;
  readonly logicalOperators: LogicalOperatorType[] = ['AND', 'OR', 'NOT'];
  readonly comparisonOperator: ComparisonOperatorType = 'COMPARE';
  readonly filterOptions: FilterType[] = [
    ...this.logicalOperators,
    this.comparisonOperator,
  ];

  emitClick(type: FilterType): void {
    this.clicks.emit({type});
    this.setActiveTab(type);
  }

  setActiveTab(type: FilterType) {
    if (
      !type &&
      this.rule?.filter &&
      Array.isArray(this.rule.filter) &&
      this.rule.filter.length > 0
    ) {
      const readableType = this.hsFiltersService.humanReadableLogOp(
        this.rule.filter[0],
      );
      this.activeTab = readableType || this.comparisonOperator;
    } else {
      this.activeTab = type;
    }
  }
}
