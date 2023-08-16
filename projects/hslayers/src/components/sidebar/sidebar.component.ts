import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subject, Subscription, delay, of, startWith, takeUntil} from 'rxjs';

import {HS_PRMS} from '../permalink/get-params';
import {HsButton} from './button.interface';
import {HsConfig} from '../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsSidebarService} from './sidebar.service';

@Component({
  selector: 'hs-sidebar',
  templateUrl: './sidebar.component.html',
})
export class HsSidebarComponent implements OnInit, OnDestroy {
  configChangesSubscription: Subscription;

  buttons: HsButton[] = [];
  miniSidebarButton: {title: string};
  private end = new Subject<void>();
  sidebarPosition: string;
  isVisible = of(true);
  constructor(
    public HsLayoutService: HsLayoutService,
    public HsCoreService: HsCoreService,
    public HsSidebarService: HsSidebarService,
    public HsShareUrlService: HsShareUrlService,
    public HsConfig: HsConfig,
    private HsEventBusService: HsEventBusService,
  ) {}

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
    this.HsSidebarService.destroy();
  }

  ngOnInit(): void {
    const panel = this.HsShareUrlService.getParamValue(HS_PRMS.panel);
    this.HsSidebarService.buttons
      .pipe(startWith([]), delay(0))
      .pipe(takeUntil(this.end))
      .subscribe((buttons) => {
        this.buttons = this.HsSidebarService.prepareForTemplate(buttons);
        this.HsSidebarService.setPanelState(this.buttons);
        this.HsSidebarService.setButtonVisibility(this.buttons);
      });
    this.miniSidebarButton = {
      title: 'SIDEBAR.additionalPanels',
    };
    if (panel) {
      setTimeout(() => {
        //Without timeout we get ExpressionChangedAfterItHasBeenCheckedError
        if (!this.HsLayoutService.minisidebar) {
          this.HsLayoutService.setMainPanel(panel);
        }
      });
    }
    this.HsEventBusService.layoutResizes
      .pipe(takeUntil(this.end))
      .subscribe(() => {
        this.HsSidebarService.setButtonVisibility(this.buttons);
      });
    this.HsConfig.configChanges.pipe(takeUntil(this.end)).subscribe(() => {
      this.HsSidebarService.setPanelState(this.buttons);
    });
    this.HsSidebarService.sidebarLoad.next();
  }

  /**
   * Seat whether to show all sidebar buttons or just a
   * subset of important ones
   */
  toggleUnimportant(): void {
    this.HsSidebarService.showUnimportant =
      !this.HsSidebarService.showUnimportant;
  }

  /**
   * Toggle sidebar mode between expanded and narrow
   */
  toggleSidebar(): void {
    this.HsLayoutService.sidebarExpanded =
      !this.HsLayoutService.sidebarExpanded;
    this.HsLayoutService.updPanelSpaceWidth();
    setTimeout(() => {
      this.HsCoreService.updateMapSize();
    }, 110);
  }
}
