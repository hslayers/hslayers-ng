import {Component} from '@angular/core';

@Component({
  selector: 'hs-nested-layers-table',
  template: require('./partials/nested-layers-table.directive.html'),
})
export class HsNestedLayersTableComponent {
  layers;
  constructor() {}
}
