import {Component, ViewRef} from '@angular/core';

import {HsCompositionsService} from '../compositions.service';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';

@Component({
  selector: 'hs-compositions-info-dialog',
  templateUrl: './info-dialog.component.html',
})
export class HsCompositionsInfoDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;
  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsCompositionsService: HsCompositionsService,
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
