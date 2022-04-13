import {Component, OnInit, ViewRef} from '@angular/core';

import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsSaveMapManagerService} from '../feature-services/save-map-manager.service';
@Component({
  selector: 'hs-save-map-dialog-result',
  templateUrl: './dialog-result.component.html',
})
export class HsSaveMapResultDialogComponent
  implements HsDialogComponent, OnInit {
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
