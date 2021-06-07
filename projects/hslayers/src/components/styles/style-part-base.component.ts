import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  template: '<div></div>',
})
export class HsStylerPartBaseComponent {
  @Output() changes = new EventEmitter<void>();

  emitChange(): void {
    this.changes.emit();
  }
}
