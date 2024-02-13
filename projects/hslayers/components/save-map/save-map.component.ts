import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsCommonEndpointsService} from 'hslayers-ng/shared/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsEndpoint} from 'hslayers-ng/shared/endpoints';
import {HsLayoutService} from 'hslayers-ng/components/layout';
import {HsPanelBaseComponent} from 'hslayers-ng/components/layout';
import {HsSaveMapDialogSpawnerService} from './dialog-spawner.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsSaveMapService} from './save-map.service';
import {HsSidebarService} from 'hslayers-ng/components/sidebar';
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
    //Used in template
    private hsConfig: HsConfig,
    private hsSaveMapManagerService: HsSaveMapManagerService,
    hsLayoutService: HsLayoutService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    //Running in background and watching observables
    private hsSaveMapDialogSpawnerService: HsSaveMapDialogSpawnerService,
    private hsSidebarService: HsSidebarService,
    private hsSaveMapService: HsSaveMapService,
  ) {
    super(hsLayoutService);
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
