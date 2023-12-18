import {
  Directive,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
@Directive({
  selector: '[hsDownload]',
})
export class HsDownloadDirective implements OnChanges {
  @Input() hsDownload = '';
  @Input() mimeType = '';
  @Output() downloadPrepared = new EventEmitter<string>();

  exportedHref: any;
  constructor(private DomSanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges) {
    const data = new Blob([this.hsDownload], {type: this.mimeType});
    const url = URL.createObjectURL(data);
    if (this.exportedHref) {
      URL.revokeObjectURL(this.exportedHref);
    }
    this.exportedHref = this.DomSanitizer.bypassSecurityTrustResourceUrl(url);
    //Timeout is needed, otherwise the hsDownload will be from previous digest i.e undefined
    setTimeout(() => {
      this.downloadPrepared.emit(this.exportedHref);
    }, 0);
  }
}
