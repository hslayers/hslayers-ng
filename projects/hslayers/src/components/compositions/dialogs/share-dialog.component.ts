import {Component, Input, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsShareService} from '../../permalink/share.service';
@Component({
  selector: 'hs-compositions-share-dialog',
  templateUrl: './dialog_share.html',
})
export class HsCompositionsShareDialogComponent implements HsDialogComponent {
  @Input() app: string;
  viewRef: ViewRef;
  data: {url; title; abstract; app: string};

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsShareService: HsShareService
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this, this.data.app);
  }

  shareOnSocial() {
    this.HsShareService.openInShareApi(
      this.data.title,
      this.data.abstract,
      this.data.url,
      this.app
    );
  }
}
