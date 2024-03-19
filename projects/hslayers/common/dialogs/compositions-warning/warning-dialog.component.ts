import {Component, ViewRef} from '@angular/core';

import {HsDialogComponent} from '../dialog-component.interface';
import {HsDialogContainerService} from '../dialog-container.service';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
@Component({
  selector: 'hs-compositions-warning-dialog',
  templateUrl: './warning-dialog.component.html',
  standalone: true,
  imports: [TranslateCustomPipe],
})
export class HsCompositionsWarningDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;

  constructor(public HsDialogContainerService: HsDialogContainerService) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
