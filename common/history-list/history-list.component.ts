import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {HsHistoryListService} from './history-list.service';

@Component({
  selector: 'hs-history-list',
  template: require('./history-list.html'),
})
export class HsHistoryListComponent implements OnChanges {
  @Input() what: string; //input
  @Output() historyUrlSelected = new EventEmitter<string>(); //output
  historyDropdownVisible = false;
  items: Array<string>;
  constructor(private HsHistoryListService: HsHistoryListService) {}
  ngOnChanges(changes: SimpleChanges): void {
    this.items = this.HsHistoryListService.readSourceHistory(
      changes.what.currentValue
    );
  }
  historyUrlClicked(value: string): void {
    this.historyUrlSelected.emit(value);
  }
}
