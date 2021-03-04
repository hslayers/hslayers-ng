import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';

import {HsConfig} from '../../config.service';
import {HsSaveMapDialogSpawnerService} from './dialog-spawner.service';
import {HsSaveMapManagerService} from './save-map-manager.service';

@Component({
  selector: 'hs-save-map',
  templateUrl: './partials/panel.html',
})
export class HsSaveMapComponent implements OnDestroy {
  endpoint = null;
  isAuthorized = false;
  advancedForm: boolean;
  subscriptions: Subscription[] = [];
  constructor(
    //Used in template
    public HsConfig: HsConfig,
    public HsSaveMapManagerService: HsSaveMapManagerService,
    public HsCommonLaymanService: HsCommonLaymanService,
    public HsCommonEndpointsService: HsCommonEndpointsService,
    //Running in background and watching observables
    public HsSaveMapDialogSpawnerService: HsSaveMapDialogSpawnerService
  ) {
    this.advancedForm =
      HsConfig.advancedForm == undefined || HsConfig.advancedForm
        ? true
        : false;
    this.subscriptions.push(
      this.HsSaveMapManagerService.panelOpened.subscribe((composition) => {
        if (composition && composition.endpoint) {
          const openedType = composition.endpoint.type;
          const found = this.HsCommonEndpointsService.endpoints.filter(
            (ep) => ep.type == openedType
          );
          if (found.length > 0) {
            this.HsSaveMapManagerService.selectEndpoint(found[0]);
          }
        }
      })
    );

    this.subscriptions.push(
      this.HsCommonEndpointsService.endpointsFilled.subscribe((value) => {
        if (value.length > 0 && !this.endpoint) {
          const laymans = value.filter((ep) => ep.type == 'layman');
          if (laymans.length > 0) {
            this.HsSaveMapManagerService.selectEndpoint(laymans[0]);
          } else {
            this.HsSaveMapManagerService.selectEndpoint(value[0]);
          }
          if (this.endpoint && this.endpoint.type == 'layman') {
            this.HsCommonLaymanService.detectAuthChange(this.endpoint);
          }
        }
      })
    );

    this.subscriptions.push(
      this.HsSaveMapManagerService.endpointSelected.subscribe((endpoint) => {
        if (endpoint) {
          this.endpoint = endpoint;
          if (endpoint.getCurrentUserIfNeeded) {
            endpoint.getCurrentUserIfNeeded(endpoint);
          }
        }
      })
    );

    this.subscriptions.push(
      this.HsCommonLaymanService.authChange.subscribe((endpoint: any) => {
        this.isAuthorized =
          endpoint.user !== 'anonymous' && endpoint.user !== 'browser';
      })
    );
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
