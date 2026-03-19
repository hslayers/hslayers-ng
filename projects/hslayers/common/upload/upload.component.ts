import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {NgClass} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {HsFileDropDirective} from './file-drop.directive';

export type HsUploadedFiles = {
  fileList: FileList;
  uploader: string;
  dropped: boolean;
};

@Component({
  selector: 'hs-file-upload',
  templateUrl: './upload.component.html',
  imports: [HsFileDropDirective, NgClass, TranslatePipe],
})
export class HsUploadComponent {
  @Output() uploaded = new EventEmitter<HsUploadedFiles>();
  @Input() acceptedFormats: string;
  @Input() uploader?: string;

  @ViewChild('fileInput') fileInput: ElementRef;
  dropzoneActive = false;

  emitHandleUpload(fileList: FileList, dropped: boolean): void {
    this.uploaded.emit({fileList, uploader: this.uploader, dropped});
  }

  dropZoneState($event: boolean): void {
    this.dropzoneActive = $event;
  }
  getFileInput(): ElementRef {
    return this.fileInput;
  }

  constructor() {}
}
