import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  template: '<div></div>',
  standalone: true,
})
export class HsStylerPartBaseComponent {
  @Output() changes = new EventEmitter<void>();
  @Output() deleteFilter = new EventEmitter<void>();

  @Input() warning: string;

  emitChange(): void {
    this.changes.emit();
  }

  deleteRuleFilter(): void {
    this.deleteFilter.emit();
  }
}
