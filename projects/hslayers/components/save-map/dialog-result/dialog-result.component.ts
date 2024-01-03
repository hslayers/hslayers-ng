import {Component, ViewRef} from '@angular/core';

import {HsDialogComponent} from 'hslayers-ng/components/layout';
import {HsDialogContainerService} from 'hslayers-ng/components/layout';
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
    /**
     * NOTE: No conditions tested as the only way this is called is when trying to overwrite
     * Overwrite attempt cannot result in 'Composition exists' eg. in this method
     * Thus - this has to always be making a request for current user workspace
     */
    this.hsSaveMapManagerService.compoData.patchValue({
      workspace: this.hsSaveMapManagerService.currentUser,
    });

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
