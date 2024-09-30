import {
  Component,
  EventEmitter,
  OnChanges,
  Output,
  SimpleChange,
  inject,
  input,
} from '@angular/core';
import {Rule} from 'geostyler-style';

import {
  ComparisonOperatorType,
  FilterType,
  LogicalOperatorType,
} from '../filter.type';
import {HsFiltersService} from '../filters.service';
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
  rule = input<Rule>();

  ngOnChanges({rule}: {rule?: SimpleChange & {currentValue: Rule}}) {
    /**
     * Set correct active tab on rule change
     */
    if (rule !== undefined) {
      if (rule.currentValue.filter?.[0]) {
        const readableType = this.hsFiltersService.humanReadableLogOp(
          rule.currentValue.filter[0],
        );
        this.setActiveTab(readableType || this.comparisonOperator);
      } else {
        this.activeTab = undefined;
      }
    }
  }

  hsFiltersService = inject(HsFiltersService);

  activeTab: FilterType;
  readonly logicalOperators: LogicalOperatorType[] = ['AND', 'OR', 'NOT'];
  readonly comparisonOperator: ComparisonOperatorType = 'COMPARE';
  readonly filterOptions: FilterType[] = [
    this.comparisonOperator,
    ...this.logicalOperators,
  ];

  emitClick(type: FilterType): void {
    this.clicks.emit({type});
    this.setActiveTab(type);
  }

  setActiveTab(type: FilterType) {
    const rule = this.rule();
    if (
      !type &&
      rule?.filter &&
      Array.isArray(rule.filter) &&
      rule.filter.length > 0
    ) {
      const readableType = this.hsFiltersService.humanReadableLogOp(
        rule.filter[0],
      );
      this.activeTab = readableType || this.comparisonOperator;
    } else {
      this.activeTab = type;
    }
  }
}
