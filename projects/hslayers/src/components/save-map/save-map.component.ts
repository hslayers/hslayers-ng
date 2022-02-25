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
  implements OnDestroy, OnInit
{
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
    hsSidebarService.buttons.push({
      panel: 'saveMap',
      module: 'hs.save-map',
      order: 12,
      fits: true,
      title: () =>
        hsLanguageService.getTranslation('PANEL_HEADER.SAVECOMPOSITION'),
      description: () =>
        hsLanguageService.getTranslation(
          'SIDEBAR.descriptions.SAVECOMPOSITION'
        ),
      icon: 'icon-save-floppy',
    });

    this.HsSaveMapManagerService.panelOpened
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((composition) => {
        if (composition && composition.endpoint) {
          const openedType = composition.endpoint.type;
          const found = this.HsCommonEndpointsService.endpoints.filter(
            (ep) => ep.type == openedType
          );
          if (found.length > 0) {
            this.HsSaveMapManagerService.selectEndpoint(found[0]);
          }
        }
      });

    this.HsCommonEndpointsService.endpointsFilled
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((value) => {
        if (value?.length > 0 && !this.endpoint) {
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
      });

    this.HsSaveMapManagerService.endpointSelected
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((endpoint) => {
        if (endpoint) {
          this.endpoint = endpoint;
          if (endpoint.getCurrentUserIfNeeded) {
            endpoint.getCurrentUserIfNeeded(endpoint);
          }
        }
      });

    this.HsCommonLaymanService.authChange
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((endpoint: any) => {
        this.isAuthorized =
          endpoint.user !== 'anonymous' && endpoint.user !== 'browser';
        this.HsSaveMapManagerService.currentUser = endpoint.user;
      });
  }
  ngOnInit() {
    this.hsSidebarService.get(this.data.app).buttons.push({
      panel: 'saveMap',
      module: 'hs.save-map',
      order: 12,
      fits: true,
      title: () =>
        this.hsLanguageService.getTranslation('PANEL_HEADER.SAVECOMPOSITION'),
      description: () =>
        this.hsLanguageService.getTranslation(
          'SIDEBAR.descriptions.SAVECOMPOSITION'
        ),
      icon: 'icon-save-floppy',
    });

    window.addEventListener('beforeunload', (e) => {
      if (this.HsConfig.get(this.data.app).saveMapStateOnReload) {
        this.hsSaveMapService.save2storage(e, this.data.app);
      }
    });
    this.advancedForm =
      this.HsConfig.get(this.data.app).advancedForm == undefined ||
      this.HsConfig.get(this.data.app).advancedForm
        ? true
        : false;
    this.HsSaveMapManagerService.panelOpened
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((composition) => {
        if (composition && composition.endpoint) {
          const openedType = composition.endpoint.type;
          const found = this.HsCommonEndpointsService.endpoints.filter(
            (ep) => ep.type == openedType
          );
          if (found.length > 0) {
            this.HsSaveMapManagerService.selectEndpoint(found[0]);
          }
        }
      });
    this.HsSaveMapManagerService.init(this.data.app);
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
