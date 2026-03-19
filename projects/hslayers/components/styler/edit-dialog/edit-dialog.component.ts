import {Component} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';

@Component({
  selector: 'hs-styles-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  imports: [TranslatePipe],
})
export class HsStylerEditDialogComponent extends HsConfirmDialogComponent {
  exitWithoutSave() {
    this.hsDialogContainerService.destroy(this);
    this.dialogItem.resolve('exit');
  }
}
