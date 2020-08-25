import {Component, Input} from '@angular/core';
import {HsConfig} from './../../config.service';
import {HsHistoryListService} from './history-list.service';

@Component({
  selector: 'hs-history-list',
  template: require('./history-list.html'),
})
export class HsHistoryListComponent {
  @Input() what: any; //input
  @Input() clicked: any; //input
  historyDropdownVisible: boolean;
  replace: boolean;
  transclude: boolean;
  items: any;
  constructor(
    private HsConfig: HsConfig,
    private HsHistoryListService: HsHistoryListService
  ) {
    this.replace = true;
    this.transclude = true;
    this.items = this.HsHistoryListService.readSourceHistory(this.what);
  }
}
