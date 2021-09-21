import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'hs-add-filter-button',
  templateUrl: './add-filter-button.component.html',
})
export class HsAddFilterButtonComponent {
  @Output() clicks = new EventEmitter();

  emitClick(kind: string): void {
    this.clicks.emit({kind});
  }
}
