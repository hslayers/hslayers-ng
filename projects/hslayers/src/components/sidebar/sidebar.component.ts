import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {Subject, Subscription, delay, startWith, takeUntil} from 'rxjs';

import {HS_PRMS} from '../permalink/get-params';
import {HsButton} from './button.interface';
import {HsConfig} from '../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutParams, HsLayoutService} from '../layout/layout.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsSidebarParams, HsSidebarService} from './sidebar.service';

@Component({
  selector: 'hs-sidebar',
  templateUrl: './partials/sidebar.html',
})
export class HsSidebarComponent implements OnInit, OnDestroy {
  configChangesSubscription: Subscription;
  @Input() app = 'default';
  buttons: HsButton[] = [];
  miniSidebarButton: {title: string};
  private end = new Subject<void>();
  private serviceAppRef: HsSidebarParams;
  layoutAppRef: HsLayoutParams;

  constructor(
    public HsLayoutService: HsLayoutService,
    public HsCoreService: HsCoreService,
    public HsSidebarService: HsSidebarService,
    public HsShareUrlService: HsShareUrlService,
    public HsConfig: HsConfig,
    private HsEventBusService: HsEventBusService
  ) {}
  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
    this.HsSidebarService.destroy(this.app);
  }
  ngOnInit(): void {
    const panel = this.HsShareUrlService.getParamValue(HS_PRMS.panel);
    this.serviceAppRef = this.HsSidebarService.get(this.app);
    this.layoutAppRef = this.HsLayoutService.get(this.app);
    this.serviceAppRef.buttons
      .pipe(startWith([]), delay(0))
      .pipe(takeUntil(this.end))
      .subscribe((buttons) => {
        this.buttons = this.HsSidebarService.prepareForTemplate(buttons);
        this.HsSidebarService.setPanelState(this.buttons, this.app);
        this.HsSidebarService.setButtonVisibility(this.buttons, this.app);
      });
    this.miniSidebarButton = {
      title: 'SIDEBAR.additionalPanels',
    };
    if (panel) {
      setTimeout(() => {
        //Without timeout we get ExpressionChangedAfterItHasBeenCheckedError
        if (!this.HsLayoutService.get(this.app).minisidebar) {
          this.HsLayoutService.setMainPanel(panel, this.app);
        }
      });
    }
    this.HsEventBusService.layoutResizes
      .pipe(takeUntil(this.end))
      .subscribe(() => {
        this.HsSidebarService.setButtonVisibility(this.buttons, this.app);
      });
    this.HsConfig.configChanges
      .pipe(takeUntil(this.end))
      .subscribe(({app, config}) => {
        if (app == this.app) {
          this.HsSidebarService.setPanelState(this.buttons, this.app);
        }
      });
    this.HsSidebarService.sidebarLoad.next(this.app);
  }

  /**
   * Seat whether to show all sidebar buttons or just a
   * subset of important ones
   */
  toggleUnimportant(): void {
    this.serviceAppRef.showUnimportant = !this.serviceAppRef.showUnimportant;
  }
  /**
   * Toggle sidebar mode between expanded and narrow
   */
  toggleSidebar(): void {
    const layoutAppRef = this.HsLayoutService.get(this.app);
    layoutAppRef.sidebarExpanded = !layoutAppRef.sidebarExpanded;
    this.HsLayoutService.updPanelSpaceWidth(this.app);
    setTimeout(() => {
      this.HsCoreService.updateMapSize(this.app);
    }, 110);
  }
}
