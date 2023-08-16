import {Component, ViewRef} from '@angular/core';

import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsSaveMapManagerService} from '../save-map-manager.service';
@Component({
  selector: 'hs-save-map-dialog-save',
  templateUrl: './dialog-save.component.html',
})
export class HsSaveMapDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: {endpoint};
  constructor(
    private hsDialogContainerService: HsDialogContainerService,
    public hsSaveMapManagerService: HsSaveMapManagerService,
  ) {}

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }

  /**
   * Initiate composition saving procedure
   * @param saveAsNew - If true save composition as new, otherwise overwrite to current one
   */
  save(saveAsNew: boolean): void {
    this.hsSaveMapManagerService.save(saveAsNew, this.data.endpoint);
    this.close();
  }

  /**
   * Select new composition's title
   */
  selectNewName(): void {
    this.hsSaveMapManagerService.selectNewName();
  }

  /**
   * Focus the browser to composition's title
   */
  focusTitle(): void {
    this.hsSaveMapManagerService.focusTitle();
    this.close();
  }
}
