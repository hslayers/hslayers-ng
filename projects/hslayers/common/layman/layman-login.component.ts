import {Component, Input, OnInit, ViewRef} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TranslatePipe} from '@ngx-translate/core';

import {HsCommonLaymanService} from './layman.service';
import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';

@Component({
  selector: 'hs-layman-login',
  templateUrl: './layman-login.component.html',
  imports: [TranslatePipe],
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
