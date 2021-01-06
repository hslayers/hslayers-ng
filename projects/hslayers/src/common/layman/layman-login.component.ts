import {Component, ViewRef} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {HsCommonLaymanService} from './layman.service';
import {HsDialogComponent} from '../../components/layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../components/layout/dialogs/dialog-container.service';
import {Input} from '@angular/core';

@Component({
  selector: 'hs-layman-login',
  templateUrl: './layman-login.html',
})
export class HsLaymanLoginComponent implements HsDialogComponent {
  @Input() data;
  viewRef: ViewRef;
  url: SafeResourceUrl;
  constructor(
    public HsCommonLaymanService: HsCommonLaymanService,
    public HsDialogContainerService: HsDialogContainerService,
    private sanitizer: DomSanitizer
  ) {
    this.HsCommonLaymanService.authChange.subscribe((endpoint) => {
      this.close();
    });
  }

  ngOnInit(): void {
    this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.data);
  }

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
