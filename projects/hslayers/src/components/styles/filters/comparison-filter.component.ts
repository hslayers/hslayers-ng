import {Component, Input} from '@angular/core';

import {HsStylerPartBaseComponent} from '../style-part-base.component';

@Component({
  selector: 'hs-comparison-filter',
  templateUrl: './comparison-filter.component.html',
})
export class HsComparisonFilterComponent extends HsStylerPartBaseComponent {
  @Input() filter;
  @Input() parent;

  constructor() {
    super();
  }

  remove(): void {
    this.parent.splice(this.parent.indexOf(this.filter), 1);
    this.emitChange();
  }
}
