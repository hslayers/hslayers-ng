import {Component, ViewRef} from '@angular/core';

import {HsCompositionsService} from '../compositions.service';
import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';

@Component({
  selector: 'hs-compositions-info-dialog',
  templateUrl: './info-dialog.component.html',
})
export class HsCompositionsInfoDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: {[key: string]: any};
  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsCompositionsService: HsCompositionsService,
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
