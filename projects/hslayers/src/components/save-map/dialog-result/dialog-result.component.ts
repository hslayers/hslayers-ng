import {Component, ViewRef} from '@angular/core';

import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsSaveMapManagerService} from '../save-map-manager.service';
@Component({
  selector: 'hs-save-map-dialog-result',
  templateUrl: './dialog-result.component.html',
})
export class HsSaveMapResultDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data = {};
  saving = false;
  constructor(
    private hsDialogContainerService: HsDialogContainerService,
    public hsSaveMapManagerService: HsSaveMapManagerService,
  ) {}

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }

  /**
   * Initiate composition's saving procedure
   * @param newSave - If true save a new composition, otherwise overwrite to current one
   */
  async initiateSave(newSave: boolean): Promise<void> {
    this.saving = true;
    await this.hsSaveMapManagerService.initiateSave(newSave);
    this.saving = false;
    this.close();
  }

  /**
   * Request to change composition's name to a new one
   */
  changeName() {
    this.hsSaveMapManagerService.saveMapResulted.next('rename');
    this.close();
  }
}
