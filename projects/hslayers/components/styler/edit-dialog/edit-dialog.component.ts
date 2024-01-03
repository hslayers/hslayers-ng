import {Component} from '@angular/core';
import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsDialogContainerService} from 'hslayers-ng/components/layout';

@Component({
  selector: 'hs-styles-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.css'],
})
export class HsStylerEditDialogComponent extends HsConfirmDialogComponent {
  constructor(public HsDialogContainerService: HsDialogContainerService) {
    super(HsDialogContainerService);
  }

  exitWithoutSave() {
    this.HsDialogContainerService.destroy(this);
    this.dialogItem.resolve('exit');
  }
}
