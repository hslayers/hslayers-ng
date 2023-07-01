import {Component, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsShareService} from '../../permalink/share.service';
@Component({
  selector: 'hs-compositions-share-dialog',
  templateUrl: './share-dialog.component.html',
})
export class HsCompositionsShareDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: {url; title; abstract; };

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsShareService: HsShareService
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
