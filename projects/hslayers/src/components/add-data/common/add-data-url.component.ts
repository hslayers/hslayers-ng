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
  @Output() connect = new EventEmitter<any>();

  constructor(private historyListService: HsHistoryListService) {
    this.items = this.historyListService.readSourceHistory(this.what);
  }

  emitConnect(): void {
    this.connect.emit();
  }

  change(): void {
    this.urlChange.emit(this.url.trim());
  }

  historySelected(url): void {
    this.url = url;
    this.change();
  }
}
