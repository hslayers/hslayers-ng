import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSaveMapDialogSpawnerService} from './dialog-spawner.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsSaveMapService} from './save-map.service';
import {HsSidebarService} from '../sidebar/sidebar.service';

@Component({
  selector: 'hs-save-map',
  templateUrl: './partials/panel.html',
})
export class HsSaveMapComponent
  extends HsPanelBaseComponent
  implements OnDestroy, OnInit {
  endpoint = null;
  isAuthorized = false;
  name = 'saveMap';
  private ngUnsubscribe = new Subject<void>();
  constructor(
    //Used in template
    public HsConfig: HsConfig,
    public HsSaveMapManagerService: HsSaveMapManagerService,
    HsLayoutService: HsLayoutService,
    public HsCommonLaymanService: HsCommonLaymanService,
    public HsCommonEndpointsService: HsCommonEndpointsService,
    //Running in background and watching observables
    public HsSaveMapDialogSpawnerService: HsSaveMapDialogSpawnerService,
    public hsLanguageService: HsLanguageService,
    public hsSidebarService: HsSidebarService,
    private hsSaveMapService: HsSaveMapService
  ) {
    super(HsLayoutService);

    this.HsCommonEndpointsService.endpointsFilled
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((filled) => {
        if (!filled) {
          return;
        }
        if (filled.endpoints?.length > 0 && !this.endpoint) {
          const laymans = filled.endpoints.filter((ep) => ep.type == 'layman');
          if (laymans.length > 0) {
            this.HsSaveMapManagerService.selectEndpoint(
              laymans[0],
              this.data.app
            );
          } else {
            this.HsSaveMapManagerService.selectEndpoint(
              filled.endpoints[0],
              this.data.app
            );
          }
          if (this.endpoint && this.endpoint.type == 'layman') {
            this.HsCommonLaymanService.detectAuthChange(
              this.endpoint,
              this.data.app
            );
          }
        }
      });

    this.HsCommonLaymanService.authChange
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({endpoint, app}) => {
        this.isAuthorized =
          endpoint.user !== 'anonymous' && endpoint.user !== 'browser';
        this.HsSaveMapManagerService.get(app).currentUser = endpoint.user;
      });
  }
  ngOnInit() {
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

    this.HsSaveMapManagerService.get(this.data.app)
      .endpointSelected.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((endpoint) => {
        if (endpoint) {
          this.endpoint = endpoint;
          if (endpoint.getCurrentUserIfNeeded) {
            endpoint.getCurrentUserIfNeeded(endpoint);
          }
        }
      });

    this.HsSaveMapManagerService.get(this.data.app)
      .panelOpened.pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((composition) => {
        if (composition && composition.endpoint) {
          const openedType = composition.endpoint.type;
          const found = this.HsCommonEndpointsService.endpoints.filter(
            (ep) => ep.type == openedType
          );
          if (found.length > 0) {
            this.HsSaveMapManagerService.selectEndpoint(
              found[0],
              this.data.app
            );
          }
        }
      });

    window.addEventListener('beforeunload', (e) => {
      if (this.HsConfig.get(this.data.app).saveMapStateOnReload) {
        this.hsSaveMapService.save2storage(e, this.data.app);
      }
    });

    this.HsSaveMapManagerService.init(this.data.app);
    this.HsSaveMapDialogSpawnerService.init(this.data.app);
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
