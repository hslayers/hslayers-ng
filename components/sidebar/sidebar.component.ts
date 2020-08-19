/* eslint-disable jsdoc/require-returns */
import * as angular from 'angular';
import {Component, OnInit} from '@angular/core';
import {HsCoreService} from './../core/core.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsSidebarService} from './sidebar.service';
import {HsConfig} from '../../config.service';

@Component({
  selector: 'hs-sidebar',
  template: require('./partials/sidebar.html'),
})
export class HsSidebarComponent implements OnInit {
  showUnimportant = true;

  constructor(
    private HsLayoutService: HsLayoutService,
    private HsCoreService: HsCoreService,
    private HsSidebarService: HsSidebarService,
    private HsPermalinkUrlService: HsShareUrlService,
    private HsConfig: HsConfig
  ) {}
  ngOnInit(): void {
    if (angular.isDefined(this.HsCoreService.config.createExtraMenu)) {
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
