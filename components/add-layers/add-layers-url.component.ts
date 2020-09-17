import {Component} from '@angular/core';
import {HsHistoryListService} from '../../common/history-list/history-list.service';

@Component({
  selector: 'hs-add-layers-url',
  template: require('./partials/add-layers-url.directive.html'),
})
export class HsAddLayersUrlComponent {
  items;
  what;
  //type: '@type'; TODO: comes from another scope
  url;
  //connect: '=connect'; TODO: comes from another scope
  //field: '=field'; TODO: some AngularJS stuff?

  constructor(private historyListService: HsHistoryListService) {
    this.items = this.historyListService.readSourceHistory(this.what);
  }

  historySelected(url): void {
    this.url = url;
  }
}
