import {Component, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
@Component({
  selector: 'hs-save-map-dialog-result',
  templateUrl: './partials/dialog_result.html',
})
export class HsSaveMapResultDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsSaveMapManagerService: HsSaveMapManagerService
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }

  initiateSave(newSave: boolean): void {
    this.HsSaveMapManagerService.initiateSave(newSave, this.data.app);
    this.close();
  }

  changeName() {
    this.HsSaveMapManagerService.saveMapResulted.next({
      statusData: 'rename',
      app: this.data.app,
    });
    this.close();
  }
}
