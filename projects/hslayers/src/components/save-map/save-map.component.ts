import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsEndpoint} from './../../common/endpoints/endpoint.interface';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSaveMapDialogSpawnerService} from './dialog-spawner.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsSaveMapService} from './save-map.service';
import {HsSidebarService} from '../sidebar/sidebar.service';
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
    private hsLanguageService: HsLanguageService,
    private hsSidebarService: HsSidebarService,
    private hsSaveMapService: HsSaveMapService
  ) {
    super(hsLayoutService);
  }
  ngOnInit() {
    this.endpoints = this.hsCommonEndpointsService.endpoints;
    this.hsSidebarService.addButton(
      {
        panel: 'saveMap',
        module: 'hs.save-map',
        order: 12,
        fits: true,
        title: 'PANEL_HEADER.SAVECOMPOSITION',
        description: 'SIDEBAR.descriptions.SAVECOMPOSITION',
        icon: 'icon-save-floppy',
      },
      this.data.app
    );

    this.hsCommonEndpointsService.endpointsFilled
      .pipe(takeUntil(this.end))
      .subscribe((filled) => {
        if (!filled || !this.data?.app) {
          return;
        }
        if (filled.endpoints?.length > 0 && !this.endpoint) {
          const laymanEp = this.hsCommonLaymanService.layman;
          if (laymanEp) {
            this.hsSaveMapManagerService.selectEndpoint(
              laymanEp,
              this.data.app
            );
          } else {
            this.hsSaveMapManagerService.selectEndpoint(
              filled.endpoints[0],
              this.data.app
            );
          }
        }
      });

    this.hsCommonLaymanService.authChange
      .pipe(takeUntil(this.end))
      .subscribe(({endpoint, app}) => {
        this.isAuthenticated = !!endpoint.user;
        this.hsSaveMapManagerService.get(app).currentUser = endpoint.user;
      });

    this.hsSaveMapManagerService
      .get(this.data.app)
      .endpointSelected.pipe(takeUntil(this.end))
      .subscribe((endpoint) => {
        if (endpoint) {
          this.endpoint = endpoint;
          if (endpoint.getCurrentUserIfNeeded) {
            endpoint.getCurrentUserIfNeeded(endpoint, this.data.app);
          }
        }
      });

    this.hsSaveMapManagerService
      .get(this.data.app)
      .panelOpened.pipe(takeUntil(this.end))
      .subscribe((composition) => {
        if (composition && composition.endpoint) {
          const openedType = composition.endpoint.type;
          const found = this.hsCommonEndpointsService.endpoints.filter((ep) =>
            ep.type.includes(openedType)
          );
          if (found.length > 0) {
            this.hsSaveMapManagerService.selectEndpoint(
              found[0],
              this.data.app
            );
          }
        }
      });

    window.addEventListener('beforeunload', () => {
      if (this.hsConfig.get(this.data.app).saveMapStateOnReload) {
        this.hsSaveMapService.save2storage(this.data.app);
      }
    });

    this.hsSaveMapManagerService.init(this.data.app);
    this.hsSaveMapDialogSpawnerService.init(this.data.app);
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
    this.hsSaveMapManagerService.selectEndpoint(endpoint, this.data.app);
  }
}
