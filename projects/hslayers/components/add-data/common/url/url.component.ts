import {Component, EventEmitter, Input, Output} from '@angular/core';

import {HsHistoryListService} from 'hslayers-ng/common/history-list';

@Component({
  selector: 'hs-common-url',
  templateUrl: './url.component.html',
})
export class HsCommonUrlComponent {
  items;
  what;
  @Input() type: any;

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
