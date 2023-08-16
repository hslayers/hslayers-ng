import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  template: '<div></div>',
})
export class HsStylerPartBaseComponent {
  @Output() changes = new EventEmitter<void>();
  @Input() warning: string;

  emitChange(): void {
    this.changes.emit();
  }
}
