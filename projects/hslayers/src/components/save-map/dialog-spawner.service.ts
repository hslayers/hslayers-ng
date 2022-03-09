import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsSaveMapDialogComponent} from './save-map-dialog.component';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsSaveMapResultDialogComponent} from './save-map.result-dialog.component';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsSaveMapDialogSpawnerService {
  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsSaveMapManagerService: HsSaveMapManagerService
  ) {
    this.HsSaveMapManagerService.saveMapResulted.subscribe(
      ({statusData, app}) => {
        if (typeof statusData != 'string') {
          this.HsDialogContainerService.create(HsSaveMapResultDialogComponent, {
            app,
            statusData,
          });
        }
      }
    );
    this.HsSaveMapManagerService.preSaveCheckCompleted.subscribe(
      ({endpoint, app}) => {
        this.HsDialogContainerService.create(HsSaveMapDialogComponent, {
          endpoint,
          app,
        });
      }
    );
  }
}
