import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import {HsHistoryListService} from './history-list.service';

@Component({
  selector: 'hs-history-list',
  templateUrl: './history-list.component.html',
  standalone: false,
})
export class HsHistoryListComponent implements OnChanges {
  hsHistoryListService = inject(HsHistoryListService);

  @Input() what: string; //input

  @Output() historyUrlSelected = new EventEmitter<string>(); //output
  items: Array<string>;
  ngOnChanges(changes: SimpleChanges): void {
    this.items = this.hsHistoryListService.readSourceHistory(
      changes.what.currentValue,
    );
  }
  historyUrlClicked(value: string): void {
    this.historyUrlSelected.emit(value);
  }
}
