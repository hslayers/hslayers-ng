import {Component, Input} from '@angular/core';

@Component({
  selector: 'hs-nested-layers-table',
  templateUrl: './partials/nested-layers-table.directive.html',
})
export class HsNestedLayersTableComponent {
  @Input() layers;
  constructor() {}
}
