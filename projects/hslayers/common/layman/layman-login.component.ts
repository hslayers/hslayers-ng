import {Component, Input, OnInit, ViewRef} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

import {HsCommonLaymanService} from './layman.service';
import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-layman-login',
  templateUrl: './layman-login.component.html',
  imports: [TranslateCustomPipe],
})
export class HsLaymanLoginComponent implements HsDialogComponent, OnInit {
  @Input() data: {
    url: string;
  };
  viewRef: ViewRef;
  url: SafeResourceUrl;
  constructor(
    public HsCommonLaymanService: HsCommonLaymanService,
    public HsDialogContainerService: HsDialogContainerService,
    private sanitizer: DomSanitizer,
  ) {
    this.HsCommonLaymanService.layman$
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.close();
      });
  }

  ngOnInit(): void {
    this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.url);
  }
  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
