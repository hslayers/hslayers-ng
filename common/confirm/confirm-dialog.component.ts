import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'hs.confirm-dialog',
  template: require('./confirm-dialog.html'),
})
export class HsConfirmDialogComponent {
  modalVisible: boolean;
  @Input() message: string;
  @Input() title: string;
  @Output() callback: EventEmitter<any> = new EventEmitter();

  constructor() {}

  yes(): void {
    this.modalVisible = false;
    this.callback.emit('yes');
  }

  no(): void {
    this.modalVisible = false;
    this.callback.emit('no');
  }
}
