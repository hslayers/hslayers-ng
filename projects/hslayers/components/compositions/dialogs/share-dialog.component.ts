import {Component, ViewRef, inject} from '@angular/core';

import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';
import {HsShareService} from 'hslayers-ng/components/share';
@Component({
  selector: 'hs-compositions-share-dialog',
  templateUrl: './share-dialog.component.html',
  standalone: false,
})
export class HsCompositionsShareDialogComponent implements HsDialogComponent {
  hsDialogContainerService = inject(HsDialogContainerService);
  hsShareService = inject(HsShareService);

  viewRef: ViewRef;
  data: {url; title; abstract};

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }

  shareOnSocial() {
    this.hsShareService.openInShareApi(
      this.data.title,
      this.data.abstract,
      this.data.url,
    );
  }
}
