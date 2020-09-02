import {HsButton} from './button.interface';
import {HsConfig} from './../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
// HsLanguageService not yet refactored
/**
 * param HsLanguageService
 */
@Injectable({
  providedIn: 'root',
})
export class HsSidebarService {
  extraButtons: Array<HsButton> = [];
  buttons: Array<HsButton> = [];
  unimportantExist: boolean;
  visibleButtons: Array<HsButton> = [];
  showUnimportant: boolean;
  constructor(
    private HsLayoutService: HsLayoutService,
    private HsConfig: HsConfig,
    private HsLanguageService: HsLanguageService,
    private HsCoreService: HsCoreService,
    private HsEventBusService: HsEventBusService,
    private HsUtilsService: HsUtilsService
  ) {
    this.extraButtons = [];
    /**
     * If buttons with importancy property exist.
     * If not, don't display expansion +/- icon
     *
     * @memberof HsSidebarService
     * @member buttons
     */
    this.unimportantExist = false;
    /**
     * List of visible buttons taking into acount viewport size
     *
     * @memberof HsSidebarService
     * @member visibleButtons
     */

    this.visibleButtons = [];
    /**
     * List of sidebar buttons
     *
     * @memberof HsSidebarService
     * @member buttons
     */
    this.buttons = [
      {
        panel: 'layermanager',
        module: 'hs.layermanager',
        order: 0,
        title: 'Layer Manager',
        description: 'Manage and style your layers in composition',
        icon: 'icon-layers',
      },
      {
        panel: 'legend',
        module: 'hs.legend',
        order: 1,
        title: 'Legend',
        description: 'Legend',
        icon: 'icon-dotlist',
      },
      {
        panel: 'info',
        module: 'hs.query',
        order: 7,
        title: 'Info panel',
        description: 'Display map-query result information',
        icon: 'icon-info-sign',
      },
      {
        panel: 'composition_browser',
        module: 'hs.compositions',
        order: 3,
        title: 'Map Compositions',
        description: 'List available map compositions',
        icon: 'icon-map',
      },
      {
        panel: 'datasource_selector',
        module: 'hs.datasource_selector',
        order: 4,
        title: 'Add layers',
        description: 'Select data or services for your map composition',
        icon: 'icon-database',
      },
      {
        panel: 'feature_crossfilter',
        module: 'hs.feature_crossfilter.controller',
        order: 5,
        title: 'Filter features',
        description: 'Crossfilter',
        icon: 'icon-analytics-piechart',
      },
      {
        panel: 'sensors',
        module: 'hs.sensors',
        order: 6,
        title: 'Sensors',
        description: '',
        icon: 'icon-weightscale',
      },
      {
        panel: 'measure',
        module: 'hs.measure',
        order: 2,
        title: 'Measurements',
        description: 'Measure distance or area at map',
        icon: 'icon-design',
        condition: true,
      },
      {
        panel: 'routing',
        module: 'HsRoutingController',
        order: 8,
        title: 'Routing',
        description: '',
        icon: 'icon-road',
      },
      {
        panel: 'tracking',
        module: 'HsTrackingController',
        order: 9,
        title: 'Tracking',
        description: '',
        icon: 'icon-screenshot',
      },
      {
        panel: 'print',
        module: 'hs.print',
        order: 10,
        title: 'Print',
        description: 'Print map',
        icon: 'icon-print',
      },
      {
        panel: 'permalink',
        module: 'hs.permalink',
        order: 11,
        title: 'Share map',
        description: 'Share map',
        icon: 'icon-share-alt',
      },
      {
        panel: 'saveMap',
        module: 'hs.save-map',
        order: 12,
        title: 'Save composition',
        description: 'Save content of map to composition',
        icon: 'icon-save-floppy',
      },
      {
        panel: 'language',
        module: 'HsLanguageController',
        order: 13,
        title: 'Change language',
        description: 'Change language',
        content: function (): string {
          return HsLanguageService.getCurrentLanguageCode().toUpperCase();
        },
      },
      {
        panel: 'mobile_settings',
        module: 'hs.mobile_settings.controller',
        order: 14,
        title: 'Application settings',
        description: 'Specify application user settings',
        icon: 'icon-settingsandroid',
      },
      {
        panel: 'search',
        module: 'HsSearchController',
        order: 15,
        title: 'Search',
        description: 'Search for location',
        icon: 'icon-search',
      },
      {
        panel: 'draw',
        module: 'hs.draw',
        order: 16,
        title: 'Draw',
        description: 'Draw new features',
        icon: 'icon-pencil',
      },
    ];
    this.HsEventBusService.mainPanelChanges.subscribe(() => {
      if (!HsLayoutService.sidebarExpanded) {
        setTimeout(() => {
          this.HsCoreService.updateMapSize();
        }, 150);
      }
    });
  }

  /**
   * Function to set if a button is important and always visible
   * or only when the sidebar buttons are expanded
   *
   * @memberof HsSidebarService
   * @function setButtonImportancy
   * @param panelName
   * @param state
   */
  setButtonImportancy(panelName: string, state: any): void {
    this.buttons.filter((b) => b.panel == panelName)[0].important = state;
    this.unimportantExist =
      this.buttons.filter((b) => b.important == false).length > 0;
  }
  buttonClicked(button: HsButton): void {
    if (button.click) {
      button.click();
    } else {
      this.HsLayoutService.setMainPanel(button.panel, true);
    }
  }
  setPanelState(buttons: Array<HsButton>): void {
    for (const button of buttons) {
      if (
        this.HsLayoutService.panelEnabled(button.panel) &&
        this.checkConfigurableButtons(button)
      ) {
        if (!this.visibleButtons.includes(button.panel)) {
          this.visibleButtons.push(button.panel);
          button.visible = true;
        }
      } else {
        button.visible = false;
      }
    }
  }

  /**
   * Returns if a button should be visible by its 'important'
   * property and current view mode defined in showUnimportant variable
   *
   * @memberof HsSidebarService
   * @function visibilityByImportancy
   * @param {HsButton} button Sidebar button
   */
  visibilityByImportancy(button: HsButton): boolean {
    if (this.HsLayoutService.sidebarBottom()) {
      return true;
    } else {
      return (
        button.important ||
        button.important === undefined ||
        !this.unimportantExist ||
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
   * @memberof HsSidebarService
   * @function checkConfigurableButtons
   * @param {object} button buttons Buttons object
   */
  checkConfigurableButtons(button: HsButton): boolean {
    if (typeof button.condition == 'undefined') {
      return true;
    } else if (!this.HsConfig.panelsEnabled) {
      return false;
    } else {
      return this.HsConfig.panelsEnabled[button.panel];
    }
  }

  /**
   * @name HsSidebarService#fitsSidebar
   * @public
   * @param {string} which Sidear button to be checked (specify panel name)
   * @description Check if sidebar button should be visible in classic sidebar or hidden inside minisidebar panel
   * @description Toggles minisidebar button
   */
  fitsSidebar(which: HsButton): boolean {
    if (window.innerWidth > 767) {
      this.HsLayoutService.minisidebar = false;
      return true;
    } else {
      if (
        this.visibleButtons.indexOf(which) + 1 >=
          this.HsLayoutService.layoutElement.clientWidth / 60 &&
        this.HsLayoutService.layoutElement.clientWidth / 60 <=
          this.visibleButtons.length - 1
      ) {
        this.HsLayoutService.minisidebar = true;
        return true;
      }
      if (
        this.HsLayoutService.layoutElement.clientWidth >
        (this.visibleButtons.length - 1) * 60
      ) {
        this.HsLayoutService.minisidebar = false;
      }
    }
  }
}
