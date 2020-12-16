import {Directive, EventEmitter, HostListener, Output} from '@angular/core';
@Directive({
  selector: '[fileDrop]',
})
export class HsAddLayersVectorFileUploadDirective {
  @Output() filesDropped = new EventEmitter<FileList>();
  @Output() filesHovered = new EventEmitter<boolean>();
  constructor() {}

  @HostListener('drop', ['$event'])
  onDrop($event): void {
    $event.preventDefault();
    const trasfer = $event.dataTransfer;
    this.filesDropped.emit(trasfer.files);
    this.filesHovered.emit(false);
  }

  @HostListener('dragover', ['$event'])
  onDragOver($event): void {
    $event.preventDefault();
    this.filesHovered.emit(true);
  }
  @HostListener('dragleave', ['$event'])
  onDragLeave($event): void {
    this.filesHovered.emit(false);
  }
}
