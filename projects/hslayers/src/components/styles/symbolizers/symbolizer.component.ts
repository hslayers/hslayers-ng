import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'hs-symbolizer',
  templateUrl: './symbolizer.html',
})
export class HsSymbolizerComponent {
  @Input() symbolizer;
  @Output() changes = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();

  kinds = ['Fill', 'Icon', 'Line', 'Text', 'Mark']; // | "Raster"

  emitChange(): void {
    this.changes.emit();
  }

  removeSymbolizer(): void {
    this.remove.emit();
  }
}
