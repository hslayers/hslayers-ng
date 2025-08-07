import {Component, ViewRef, inject} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {HsDialogComponent} from '../dialog-component.interface';
import {HsDialogContainerService} from '../dialog-container.service';
@Component({
  selector: 'hs-compositions-warning-dialog',
  templateUrl: './warning-dialog.component.html',
  imports: [TranslatePipe],
})
export class HsCompositionsWarningDialogComponent implements HsDialogComponent {
  hsDialogContainerService = inject(HsDialogContainerService);

  viewRef: ViewRef;
  data: any;

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }
}
