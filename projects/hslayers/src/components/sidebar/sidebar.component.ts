import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {Subscription, delay, startWith} from 'rxjs';

import {HS_PRMS} from '../permalink/get-params';
import {HsButton} from './button.interface';
import {HsConfig} from '../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsSidebarService} from './sidebar.service';

@Component({
  selector: 'hs-sidebar',
  templateUrl: './partials/sidebar.html',
})
export class HsSidebarComponent implements OnInit, OnDestroy {
  configChangesSubscription: Subscription;
  @Input() app = 'default';
  buttons: HsButton[] = [];
  miniSidebarButton: {title: string};
  constructor(
    public HsLayoutService: HsLayoutService,
    public HsCoreService: HsCoreService,
    public HsSidebarService: HsSidebarService,
    public HsPermalinkUrlService: HsShareUrlService,
    public HsConfig: HsConfig,
    private HsLanguageService: HsLanguageService
  ) {}
  ngOnDestroy(): void {
    this.configChangesSubscription.unsubscribe();
  }
  ngOnInit(): void {
    const panel = this.HsPermalinkUrlService.getParamValue(HS_PRMS.panel);
    this.HsSidebarService.get(this.app)
      .buttons.pipe(startWith([]), delay(0))
      .subscribe((buttons) => {
        this.buttons = buttons.map((button) => {
          if (typeof button.title == 'function') {
            button.title = button.title();
          }
          if (typeof button.description == 'function') {
            button.description = button.description();
          }
          return button;
        });
        this.buttons.sort((a, b) => a.order - b.order);
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
    this.configChangesSubscription = this.HsConfig.configChanges.subscribe(
      (_) => {
        this.HsSidebarService.setPanelState(this.buttons, this.app);
      }
    );
    this.HsSidebarService.sidebarLoad.next(this.app);
  }

  /**
   * Seat whether to show all sidebar buttons or just a
   * subset of important ones
   */
  toggleUnimportant(): void {
    this.HsSidebarService.get(this.app).showUnimportant =
      !this.HsSidebarService.get(this.app).showUnimportant;
  }
  /**
   * Toggle sidebar mode between expanded and narrow
   */
  toggleSidebar(): void {
    this.HsLayoutService.get(this.app).sidebarExpanded =
      !this.HsLayoutService.get(this.app).sidebarExpanded;
    this.HsLayoutService.updPanelSpaceWidth(this.app);
    setTimeout(() => {
      this.HsCoreService.updateMapSize(this.app);
    }, 110);
  }
}
