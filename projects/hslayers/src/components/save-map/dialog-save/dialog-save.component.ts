import {Component, OnInit, ViewRef} from '@angular/core';

import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {
  HsSaveMapManagerParams,
  HsSaveMapManagerService,
} from '../save-map-manager.service';
@Component({
  selector: 'hs-save-map-dialog-save',
  templateUrl: './dialog-save.component.html',
})
export class HsSaveMapDialogComponent implements HsDialogComponent, OnInit {
  viewRef: ViewRef;
  data: {endpoint; app: string};
  appRef: HsSaveMapManagerParams;
  constructor(
    private hsDialogContainerService: HsDialogContainerService,
    private hsSaveMapManagerService: HsSaveMapManagerService
  ) {}
  ngOnInit() {
    this.appRef = this.hsSaveMapManagerService.get(this.data.app);
  }

  close(): void {
    this.hsDialogContainerService.destroy(this, this.data.app);
  }

  /**
   * Initiate composition saving procedure
   * @param saveAsNew - If true save composition as new, otherwise overwrite to current one
   */
  save(saveAsNew: boolean): void {
    this.hsSaveMapManagerService.save(
      saveAsNew,
      this.data.endpoint,
      this.data.app
    );
    this.close();
  }

  /**
   * Select new composition's title
   */
  selectNewName(): void {
    this.hsSaveMapManagerService.selectNewName(this.data.app);
  }

  /**
   * Focus the browser to composition's title
   */
  focusTitle(): void {
    this.hsSaveMapManagerService.focusTitle(this.data.app);
    this.close();
  }
}
