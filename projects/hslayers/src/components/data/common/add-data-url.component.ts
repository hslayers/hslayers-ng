import {Component, EventEmitter, Input, Output} from '@angular/core';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';

@Component({
  selector: 'hs-add-data-common-url',
  templateUrl: './add-data-url.directive.html',
})
export class HsAddDataUrlComponent {
  items;
  what;
  @Input() type: any; // @type'; TODO: comes from another scope

  @Input() url: any;
  @Output() urlChange = new EventEmitter<any>();

  @Input() connect: any; //'=connect'; TODO: comes from another scope
  //field: '=field'; TODO: some AngularJS stuff?

  constructor(private historyListService: HsHistoryListService) {
    this.items = this.historyListService.readSourceHistory(this.what);
  }

  change(): void {
    this.urlChange.emit(this.url);
  }

  historySelected(url): void {
    this.url = url;
    this.change();
  }
}
