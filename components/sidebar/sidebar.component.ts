/* eslint-disable jsdoc/require-returns */
import * as angular from 'angular';
import {Component, OnInit} from '@angular/core';
import {HsButton} from './button.interface';
import {HsConfig} from './../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPermalinkUrlService} from '../permalink/permalink-url.service';
import {HsSidebarService} from './sidebar.service';
@Component({
  selector: 'hs-sidebar',
  template: require('./partials/sidebar.html'),
})
export class HsSidebarComponent implements OnInit {
  showUnimportant = true;

  constructor(
    private HsLayoutService: HsLayoutService,
    private HsConfig: HsConfig,
    private HsCoreService: HsCoreService,
    private HsSidebarService: HsSidebarService,
    private HsPermalinkUrlService: HsPermalinkUrlService
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
  }
  /**
   * Set visibility parameter of buttons object
   *
   * @memberof HsSidebarComponent
   * @function setPanelState
   * @param {object} buttons Buttons object
   */
  setPanelState(buttons: Array<HsButton>): void {
    for (const button of buttons) {
      if (
        this.HsLayoutService.panelEnabled(button.panel) &&
        this.checkConfigurableButtons(button)
      ) {
        if (!this.HsSidebarService.visibleButtons.includes(button.panel)) {
          this.HsSidebarService.visibleButtons.push(button.panel);
          button.visible = true;
        }
      } else {
        button.visible = false;
      }
    }
  }

  /**
   * Seat weather to show all sidebar buttons or just a
   * subset of important ones
   *
   * @memberof HsSidebarComponent
   * @function toggleUnimportant
   */
  toggleUnimportant(): void {
    this.showUnimportant = !this.showUnimportant;
  }

  /**
   * Returns if a button should be visible by its 'important'
   * property and current view mode defined in showUnimportant variable
   *
   * @memberof HsSidebarComponent
   * @function visibilityByImportancy
   * @param button
   */
  visibilityByImportancy(button: HsButton): boolean {
    if (HsLayoutService.sidebarBottom()) {
      return true;
    } else {
      return (
        button.important ||
        angular.isUndefined(button.important) ||
        !this.HsSidebarService.unimportantExist ||
        this.showUnimportant
      );
    }
  }

  /**
   * Checks whether the panels, which could be placed both in map or
   * in sidebar, have state defined in config.panelsEnabled. If yes it
   * should be placed in sidebar rather then in map.
   * It´s necessary for buttons like 'measure' because simple
   * 'config.panelsEnabled = false' would prevent their functionality.
   *
   * @memberof HsSidebarComponent
   * @function checkConfigurableButtons
   * @param {object} button buttons Buttons object
   */
  checkConfigurableButtons(button): any {
    if (typeof button.condition == 'undefined') {
      return true;
    } else if (angular.isUndefined(this.HsConfig.panelsEnabled)) {
      return false;
    } else {
      return this.HsConfig.panelsEnabled[button.panel];
    }
  }

  /**
   * @name HsSidebarComponent#fitsSidebar
   * @public
   * @param {string} which Sidear button to be checked (specify panel name)
   * @description Check if sidebar button should be visible in classic sidebar or hidden inside minisidebar panel
   * @description Toggles minisidebar button
   */
  fitsSidebar(which): boolean {
    if (window.innerWidth > 767) {
      HsLayoutService.minisidebar = false;
      return true;
    } else {
      if (
        this.HsSidebarService.visibleButtons.indexOf(which) + 1 >=
          window.innerWidth / 60 &&
        window.innerWidth / 60 <=
          this.HsSidebarService.visibleButtons.length - 1
      ) {
        HsLayoutService.minisidebar = true;
        return true;
      }
      if (
        window.innerWidth >
        (this.HsSidebarService.visibleButtons.length - 1) * 60
      ) {
        HsLayoutService.minisidebar = false;
      }
    }
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
  }
}
