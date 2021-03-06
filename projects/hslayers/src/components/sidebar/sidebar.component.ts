import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsConfig} from '../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsSidebarService} from './sidebar.service';

@Component({
  selector: 'hs-sidebar',
  templateUrl: './partials/sidebar.html',
})
export class HsSidebarComponent implements OnInit, OnDestroy {
  configChangesSubscription: Subscription;
  constructor(
    public HsLayoutService: HsLayoutService,
    public HsCoreService: HsCoreService,
    public HsSidebarService: HsSidebarService,
    public HsPermalinkUrlService: HsShareUrlService,
    public HsConfig: HsConfig
  ) {}
  ngOnDestroy(): void {
    this.configChangesSubscription.unsubscribe();
  }
  ngOnInit(): void {
    if (this.HsCoreService.config.createExtraMenu !== undefined) {
      this.HsCoreService.config.createExtraMenu(this.HsSidebarService);
    }
    if (this.HsPermalinkUrlService.getParamValue('hs_panel')) {
      if (!this.HsLayoutService.minisidebar) {
        this.HsLayoutService.setMainPanel(
          this.HsPermalinkUrlService.getParamValue('hs_panel')
        );
      }
    }
    this.HsSidebarService.setPanelState(this.HsSidebarService.buttons);
    this.configChangesSubscription = this.HsConfig.configChanges.subscribe(
      (_) => {
        this.HsSidebarService.setPanelState(this.HsSidebarService.buttons);
      }
    );
    this.HsSidebarService.sidebarLoad.next();
  }

  /**
   * Seat whether to show all sidebar buttons or just a
   * subset of important ones
   */
  toggleUnimportant(): void {
    this.HsSidebarService.showUnimportant = !this.HsSidebarService
      .showUnimportant;
  }
  /**
   * Toggle sidebar mode between expanded and narrow
   */
  toggleSidebar(): void {
    this.HsLayoutService.sidebarExpanded = !this.HsLayoutService
      .sidebarExpanded;
    setTimeout(() => {
      this.HsCoreService.updateMapSize();
    }, 110);
  }
}
