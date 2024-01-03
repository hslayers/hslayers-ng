import {Component, ViewRef} from '@angular/core';

import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/components/layout';
import {HsShareService} from 'hslayers-ng/components/share';
@Component({
  selector: 'hs-compositions-share-dialog',
  templateUrl: './share-dialog.component.html',
})
export class HsCompositionsShareDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: {url; title; abstract};

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsShareService: HsShareService,
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }

  shareOnSocial() {
    this.HsShareService.openInShareApi(
      this.data.title,
      this.data.abstract,
      this.data.url,
    );
  }
}
