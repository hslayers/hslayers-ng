import {Component, ViewRef} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {HsDialogComponent} from '../dialog-component.interface';
import {HsDialogContainerService} from '../dialog-container.service';
@Component({
  selector: 'hs-compositions-warning-dialog',
  templateUrl: './warning-dialog.component.html',
  imports: [TranslatePipe],
})
export class HsCompositionsWarningDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;

  constructor(public HsDialogContainerService: HsDialogContainerService) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
