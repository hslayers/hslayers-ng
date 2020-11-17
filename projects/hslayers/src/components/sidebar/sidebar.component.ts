/* eslint-disable jsdoc/require-returns */
import {Component, OnInit} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsSidebarService} from './sidebar.service';

@Component({
  selector: 'hs-sidebar',
  templateUrl: './partials/sidebar.html',
})
export class HsSidebarComponent implements OnInit {

  constructor(
    public HsLayoutService: HsLayoutService,
    public HsCoreService: HsCoreService,
    public HsSidebarService: HsSidebarService,
    public HsPermalinkUrlService: HsShareUrlService,
    public HsConfig: HsConfig
  ) {}
  ngOnInit(): void {
    if (this.HsCoreService.config.createExtraMenu !== undefined) {
      this.HsCoreService.config.createExtraMenu(this.HsSidebarService);
    }
    if (this.HsPermalinkUrlService.getParamValue('hs_panel')) {
      if (this.HsCoreService.exists() && !this.HsLayoutService.minisidebar) {
        this.HsLayoutService.setMainPanel(
          this.HsPermalinkUrlService.getParamValue('hs_panel')
        );
      }
    }
    this.HsSidebarService.setPanelState(this.HsSidebarService.buttons);
    this.HsSidebarService.sidebarLoad.next();
  }

  /**
   * Seat weather to show all sidebar buttons or just a
   * subset of important ones
   *
   * @memberof HsSidebarComponent
   * @function toggleUnimportant
   */
  toggleUnimportant(): void {
    this.HsSidebarService.showUnimportant = !this.HsSidebarService
      .showUnimportant;
  }
  /**
   * Toggle sidebar mode between expanded and narrow
   *
   * @memberof HsSidebarComponent
   * @function toggleSidebar
   */
  toggleSidebar(): void {
    this.HsLayoutService.sidebarExpanded = !this.HsLayoutService
      .sidebarExpanded;
    setTimeout(() => {
      this.HsCoreService.updateMapSize();
    }, 110);
  }
}
