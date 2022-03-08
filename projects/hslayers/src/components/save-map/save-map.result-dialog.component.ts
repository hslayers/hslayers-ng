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
  appRef;

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsSaveMapManagerService: HsSaveMapManagerService
  ) {}

  ngOnInit() {
    this.appRef = this.HsSaveMapManagerService.get(this.data.app);
  }

  close(): void {
    this.HsDialogContainerService.destroy(this, this.data.app);
  }

  initiateSave(newSave: boolean): void {
    this.HsSaveMapManagerService.initiateSave(newSave, this.data.app);
    this.close();
  }

  changeName() {
    this.HsSaveMapManagerService.get(this.data.app).saveMapResulted.next({
      statusData: 'rename',
      app: this.data.app,
    });
    this.close();
  }
}
