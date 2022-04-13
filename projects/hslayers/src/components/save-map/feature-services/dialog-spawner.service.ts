import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsSaveMapDialogComponent} from '../dialog-save/dialog-save.component';
import {HsSaveMapManagerService} from './../feature-services/save-map-manager.service';
import {HsSaveMapResultDialogComponent} from '../dialog-result/dialog-result.component';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsSaveMapDialogSpawnerService {
  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsSaveMapManagerService: HsSaveMapManagerService
  ) {}

  init(app: string) {
    this.HsSaveMapManagerService.get(app).saveMapResulted.subscribe(
      ({statusData, app}) => {
        if (typeof statusData != 'string') {
          this.HsDialogContainerService.create(
            HsSaveMapResultDialogComponent,
            {
              app,
              statusData,
            },
            app
          );
        }
      }
    );
    this.HsSaveMapManagerService.get(app).preSaveCheckCompleted.subscribe(
      ({endpoint, app}) => {
        this.HsDialogContainerService.create(
          HsSaveMapDialogComponent,
          {
            endpoint,
            app,
          },
          app
        );
      }
    );
  }
}
