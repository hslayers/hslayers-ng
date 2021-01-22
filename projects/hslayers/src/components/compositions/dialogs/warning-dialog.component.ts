import {Component, ViewRef} from '@angular/core';
import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
@Component({
  selector: 'hs-compositions-warning-dialog',
  templateUrl: './dialog_warning.html',
})
export class HsCompositionsWarningDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsCompositionsParserService: HsCompositionsParserService
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
  ignoreContinue(): void {
    this.HsCompositionsParserService.ignoreWarning = true;
    this.close();
  }
}
