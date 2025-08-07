import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  inject,
} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

@Directive({
  selector: '[hsDownload]',
  standalone: true,
})
export class HsDownloadDirective implements OnDestroy {
  private domSanitizer = inject(DomSanitizer);

  @Input() hsDownload = '';
  @Input() mimeType = '';
  @Output() downloadPrepared = new EventEmitter<SafeResourceUrl>();

  private exportedHref: SafeResourceUrl | null = null;
  private blobUrl: string | null = null;

  /**
   * Clean up any created object URLs when the directive is destroyed
   */
  ngOnDestroy(): void {
    this.cleanupResources();
  }

  /**
   * Prepare the download URL only when the user clicks
   */
  @HostListener('click')
  onClick(): void {
    this.prepareDownload();
  }

  /**
   * Creates the Blob and object URL for download
   */
  prepareDownload(): void {
    // Clean up previous resources if they exist
    this.cleanupResources();

    // Create new resources
    const data = new Blob([this.hsDownload], {type: this.mimeType});
    this.blobUrl = URL.createObjectURL(data);
    this.exportedHref = this.domSanitizer.bypassSecurityTrustResourceUrl(
      this.blobUrl,
    );

    // Emit the prepared URL
    this.downloadPrepared.emit(this.exportedHref);
  }

  /**
   * Cleanup resources to prevent memory leaks
   */
  private cleanupResources(): void {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
      this.exportedHref = null;
    }
  }
}
