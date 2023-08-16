import {Injectable} from '@angular/core';

import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsSaveMapDialogComponent} from './dialog-save/dialog-save.component';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsSaveMapResultDialogComponent} from './dialog-result/dialog-result.component';

@Injectable({
  providedIn: 'root',
})
export class HsSaveMapDialogSpawnerService {
  constructor(
    private hsDialogContainerService: HsDialogContainerService,
    private hsSaveMapManagerService: HsSaveMapManagerService,
  ) {
    this.hsSaveMapManagerService.saveMapResulted.subscribe((statusData) => {
      if (typeof statusData != 'string') {
        this.hsDialogContainerService.create(HsSaveMapResultDialogComponent, {
          statusData,
        });
      }
    });
    this.hsSaveMapManagerService.preSaveCheckCompleted.subscribe((endpoint) => {
      this.hsDialogContainerService.create(HsSaveMapDialogComponent, {
        endpoint,
      });
    });
  }
}
