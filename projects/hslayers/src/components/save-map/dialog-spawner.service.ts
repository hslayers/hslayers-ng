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
    private hsSaveMapManagerService: HsSaveMapManagerService
  ) {}

  /**
   * Initialize the SaveMapDialogSpawnerService data and subscribers
   * @param app - App identifier
   */
  init(app: string) {
    this.hsSaveMapManagerService
      .get(app)
      .saveMapResulted.subscribe(({statusData, app}) => {
        if (typeof statusData != 'string') {
          this.hsDialogContainerService.create(
            HsSaveMapResultDialogComponent,
            {
              app,
              statusData,
            },
            app
          );
        }
      });
    this.hsSaveMapManagerService
      .get(app)
      .preSaveCheckCompleted.subscribe(({endpoint, app}) => {
        this.hsDialogContainerService.create(
          HsSaveMapDialogComponent,
          {
            endpoint,
            app,
          },
          app
        );
      });
  }
}
