import {Component, OnInit, ViewRef} from '@angular/core';

import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {
  HsSaveMapManagerParams,
  HsSaveMapManagerService,
} from '../save-map-manager.service';
@Component({
  selector: 'hs-save-map-dialog-result',
  templateUrl: './dialog-result.component.html',
})
export class HsSaveMapResultDialogComponent
  implements HsDialogComponent, OnInit {
  viewRef: ViewRef;
  data: {
    app: string;
  };
  appRef: HsSaveMapManagerParams;

  constructor(
    private hsDialogContainerService: HsDialogContainerService,
    private hsSaveMapManagerService: HsSaveMapManagerService
  ) {}

  ngOnInit(): void {
    this.appRef = this.hsSaveMapManagerService.get(this.data.app);
  }

  close(): void {
    this.hsDialogContainerService.destroy(this, this.data.app);
  }

  /**
   * Initiate composition's saving procedure
   * @param newSave - If true save a new composition, otherwise overwrite to current one
   */
  initiateSave(newSave: boolean): void {
    this.hsSaveMapManagerService.initiateSave(newSave, this.data.app);
    this.close();
  }

  /**
   * Request to change composition's name to a new one
   */
  changeName() {
    this.hsSaveMapManagerService.get(this.data.app).saveMapResulted.next({
      statusData: 'rename',
      app: this.data.app,
    });
    this.close();
  }
}
