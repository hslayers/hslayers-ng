import {Component, Input} from '@angular/core';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';

@Component({
  selector: 'hs-add-layers-url',
  template: require('./add-layers-url.directive.html'),
})
export class HsAddLayersUrlComponent {
  items;
  what;
  @Input() type; // @type'; TODO: comes from another scope
  @Input() url;
  @Input() connect; //'=connect'; TODO: comes from another scope
  //field: '=field'; TODO: some AngularJS stuff?

  constructor(private historyListService: HsHistoryListService) {
    console.log(this.type);
    console.log(this.url);
    console.log(this.connect);
    this.items = this.historyListService.readSourceHistory(this.what);
  }

  historySelected(url): void {
    this.url = url;
  }
}
