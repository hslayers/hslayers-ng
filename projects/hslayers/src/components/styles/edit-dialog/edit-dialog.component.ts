import {Component, OnInit} from '@angular/core';
import {HsConfirmDialogComponent} from '../../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';

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
