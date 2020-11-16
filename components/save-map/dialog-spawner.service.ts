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
    this.HsSaveMapManagerService.saveMapResulted.subscribe((statusData) => {
      this.HsDialogContainerService.create(HsSaveMapResultDialogComponent, {
        statusData,
      });
    });
    this.HsSaveMapManagerService.preSaveCheckCompleted.subscribe(() => {
      this.HsDialogContainerService.create(HsSaveMapDialogComponent, {});
    });
  }
}
