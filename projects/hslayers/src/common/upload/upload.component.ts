import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

export type HsUploadedFiles = {
  fileList: FileList;
  uploader: string;
  dropped: boolean;
};

@Component({
  selector: 'hs-file-upload',
  templateUrl: './upload.html',
})
export class HsUploadComponent {
  @Output() uploaded = new EventEmitter<HsUploadedFiles>();
  @Input() acceptedFormats: string;
  @Input() uploader?: string;
  @ViewChild('vectorFileInput') vectorFileInput: ElementRef;
  dropzoneActive = false;

  emitHandleUpload(fileList: FileList, dropped: boolean): void {
    this.uploaded.emit({fileList, uploader: this.uploader, dropped});
  }

  dropZoneState($event: boolean): void {
    this.dropzoneActive = $event;
  }
  getVectorFileInput(): ElementRef {
    return this.vectorFileInput;
  }

  constructor() {}
}
