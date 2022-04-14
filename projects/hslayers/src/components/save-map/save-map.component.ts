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
import {HsSaveMapDialogSpawnerService} from './feature-services/dialog-spawner.service';
import {HsSaveMapManagerService} from './feature-services/save-map-manager.service';
import {HsSaveMapService} from './save-map.service';
import {HsSidebarService} from '../sidebar/sidebar.service';
@Component({
  selector: 'hs-save-map',
  templateUrl: './save-map.component.html',
})
export class HsSaveMapComponent
  extends HsPanelBaseComponent
  implements OnDestroy, OnInit {
  endpoint: HsEndpoint = null;
  endpoints: HsEndpoint[];
  isAuthorized = false;
  name = 'saveMap';
  private ngUnsubscribe = new Subject<void>();
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
        title: () =>
          this.hsLanguageService.getTranslation(
            'PANEL_HEADER.SAVECOMPOSITION',
            undefined,
            this.data.app
          ),
        description: () =>
          this.hsLanguageService.getTranslation(
            'SIDEBAR.descriptions.SAVECOMPOSITION',
            undefined,
            this.data.app
          ),
        icon: 'icon-save-floppy',
      },
      this.data.app
    );

    this.hsCommonEndpointsService.endpointsFilled
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((filled) => {
        if (!filled || !this.data?.app) {
          return;
        }
        if (filled.endpoints?.length > 0 && !this.endpoint) {
          const laymans = filled.endpoints.filter((ep) => ep.type == 'layman');
          if (laymans.length > 0) {
            this.hsSaveMapManagerService.selectEndpoint(
              laymans[0],
              this.data.app
            );
          } else {
            this.hsSaveMapManagerService.selectEndpoint(
              filled.endpoints[0],
              this.data.app
            );
          }
          if (this.endpoint && this.endpoint.type == 'layman') {
            this.hsCommonLaymanService.detectAuthChange(
              this.endpoint,
              this.data.app
            );
          }
        }
      });

    this.hsCommonLaymanService.authChange
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({endpoint, app}) => {
        this.isAuthorized =
          endpoint.user !== 'anonymous' && endpoint.user !== 'browser';
        this.hsSaveMapManagerService.get(app).currentUser = endpoint.user;
      });

    this.hsSaveMapManagerService
      .get(this.data.app)
      .endpointSelected.pipe(takeUntil(this.ngUnsubscribe))
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
      .panelOpened.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((composition) => {
        if (composition && composition.endpoint) {
          const openedType = composition.endpoint.type;
          const found = this.hsCommonEndpointsService.endpoints.filter(
            (ep) => ep.type == openedType
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
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Select service endpoint, which will be used to save the map composition
   * @param endpoint - Endpoint to select
   */
  selectEndpoint(endpoint: HsEndpoint): void {
    this.hsSaveMapManagerService.selectEndpoint(endpoint, this.data.app);
  }
}
