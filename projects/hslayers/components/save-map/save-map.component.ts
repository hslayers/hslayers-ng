import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsEndpoint} from 'hslayers-ng/types';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsSaveMapDialogSpawnerService} from './dialog-spawner.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsSaveMapService} from 'hslayers-ng/services/save-map';

@Component({
  selector: 'hs-save-map',
  templateUrl: './save-map.component.html',
})
export class HsSaveMapComponent
  extends HsPanelBaseComponent
  implements OnDestroy, OnInit
{
  endpoint: HsEndpoint = null;
  endpoints: HsEndpoint[];
  isAuthenticated = false;
  name = 'saveMap';
  private end = new Subject<void>();
  constructor(
    private hsConfig: HsConfig,
    private hsSaveMapManagerService: HsSaveMapManagerService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    //Running in background and watching observables
    private hsSaveMapDialogSpawnerService: HsSaveMapDialogSpawnerService,
    private hsSaveMapService: HsSaveMapService,
  ) {
    super();
  }
  ngOnInit() {
    super.ngOnInit();
    this.endpoints = this.hsCommonEndpointsService.endpoints;

    this.hsCommonEndpointsService.endpointsFilled
      .pipe(takeUntil(this.end))
      .subscribe((endpoints) => {
        if (endpoints?.length > 0 && !this.endpoint) {
          const laymanEp = this.hsCommonLaymanService.layman;
          if (laymanEp) {
            this.hsSaveMapManagerService.selectEndpoint(laymanEp);
          } else {
            this.hsSaveMapManagerService.selectEndpoint(endpoints[0]);
          }
        }
      });

    this.hsCommonLaymanService.authChange
      .pipe(takeUntil(this.end))
      .subscribe((endpoint) => {
        this.isAuthenticated = endpoint.authenticated;
        this.hsSaveMapManagerService.currentUser = endpoint.user;
      });

    this.hsSaveMapManagerService.endpointSelected
      .pipe(takeUntil(this.end))
      .subscribe((endpoint) => {
        if (endpoint) {
          this.endpoint = endpoint;
          if (endpoint.getCurrentUserIfNeeded) {
            endpoint.getCurrentUserIfNeeded(endpoint);
          }
        }
      });

    this.hsSaveMapManagerService.panelOpened
      .pipe(takeUntil(this.end))
      .subscribe((composition) => {
        if (composition && composition.endpoint) {
          const openedType = composition.endpoint.type;
          const found = this.hsCommonEndpointsService.endpoints.filter((ep) =>
            ep.type.includes(openedType),
          );
          if (found.length > 0) {
            this.hsSaveMapManagerService.selectEndpoint(found[0]);
          }
        }
      });

    window.addEventListener('beforeunload', () => {
      if (this.hsConfig.saveMapStateOnReload) {
        this.hsSaveMapService.save2storage();
      }
    });
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  /**
   * Select service endpoint, which will be used to save the map composition
   * @param endpoint - Endpoint to select
   */
  selectEndpoint(endpoint: HsEndpoint): void {
    this.hsSaveMapManagerService.selectEndpoint(endpoint);
  }
}
