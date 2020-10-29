import {HsButton} from './button.interface';
import {HsConfig} from './../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {TranslateService} from '@ngx-translate/core';
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
  sidebarLoad: Subject<any> = new Subject();
  /**
   * If buttons with importancy property exist.
   * If not, don't display expansion +/- icon
   *
   * @memberof HsSidebarService
   * @member buttons
   */
  unimportantExist = false;
  visibleButtons: Array<HsButton> = [];
  showUnimportant: boolean;
  constructor(
    private HsLayoutService: HsLayoutService,
    private HsConfig: HsConfig,
    private HsLanguageService: HsLanguageService,
    private HsCoreService: HsCoreService,
    private HsEventBusService: HsEventBusService,
    private HsUtilsService: HsUtilsService,
    private TranslateService: TranslateService
  ) {
    this.extraButtons = [];
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
        title: () => this.HsLanguageService.getTranslation('PANEL_HEADER.LM'),
        description: () =>
          this.HsLanguageService.getTranslation('SIDEBAR.descriptions.LM'),
        icon: 'icon-layers',
      },
      {
        panel: 'legend',
        module: 'hs.legend',
        order: 1,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.LEGEND'),
        description: () =>
          this.HsLanguageService.getTranslation('SIDEBAR.descriptions.LEGEND'),
        icon: 'icon-dotlist',
      },
      {
        panel: 'info',
        module: 'hs.query',
        order: 7,
        title: () => this.HsLanguageService.getTranslation('PANEL_HEADER.INFO'),
        description: () =>
          this.HsLanguageService.getTranslation('SIDEBAR.descriptions.INFO'),
        icon: 'icon-info-sign',
      },
      {
        panel: 'composition_browser',
        module: 'hs.compositions',
        order: 3,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.MAPCOMPOSITIONS'),
        description: () =>
          this.HsLanguageService.getTranslation(
            'SIDEBAR.descriptions.MAPCOMPOSITIONS'
          ),
        icon: 'icon-map',
      },
      {
        panel: 'datasource_selector',
        module: 'hs.datasource_selector',
        order: 4,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.ADDLAYERS'),
        description: () =>
          this.HsLanguageService.getTranslation(
            'SIDEBAR.descriptions.ADDLAYERS'
          ),
        icon: 'icon-database',
      },
      {
        panel: 'feature_crossfilter',
        module: 'hs.feature_crossfilter.controller',
        order: 5,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.FILTERFEATURES'),
        description: () =>
          this.HsLanguageService.getTranslation(
            'SIDEBAR.descriptions.FILTERFEATURES'
          ),
        icon: 'icon-analytics-piechart',
      },
      {
        panel: 'sensors',
        module: 'hs.sensors',
        order: 6,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.SENSORS'),
        description: '',
        icon: 'icon-weightscale',
      },
      {
        panel: 'measure',
        module: 'hs.measure',
        order: 2,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.MEASURE'),
        description: () =>
          this.HsLanguageService.getTranslation('SIDEBAR.descriptions.MEASURE'),
        icon: 'icon-design',
        condition: true,
      },
      {
        panel: 'routing',
        module: 'HsRoutingController',
        order: 8,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.ROUTING'),
        description: '',
        icon: 'icon-road',
      },
      {
        panel: 'tracking',
        module: 'HsTrackingController',
        order: 9,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.TRACKING'),
        description: '',
        icon: 'icon-screenshot',
      },
      {
        panel: 'print',
        module: 'hs.print',
        order: 10,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.PRINT'),
        description: () =>
          this.HsLanguageService.getTranslation('SIDEBAR.descriptions.PRINT'),
        icon: 'icon-print',
      },
      {
        panel: 'permalink',
        module: 'hs.permalink',
        order: 11,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.PERMALINK'),
        description: () =>
          this.HsLanguageService.getTranslation(
            'SIDEBAR.descriptions.PERMALINK'
          ),
        icon: 'icon-share-alt',
      },
      {
        panel: 'saveMap',
        module: 'hs.save-map',
        order: 12,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.SAVECOMPOSITION'),
        description: () =>
          this.HsLanguageService.getTranslation(
            'SIDEBAR.descriptions.SAVECOMPOSITION'
          ),
        icon: 'icon-save-floppy',
      },
      {
        panel: 'language',
        module: 'hs.language',
        order: 13,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.LANGUAGE'),
        description: () =>
          this.HsLanguageService.getTranslation(
            'SIDEBAR.descriptions.LANGUAGE'
          ),
        content: () => {
          return this.HsLanguageService.getCurrentLanguageCode().toUpperCase();
        },
      },
      {
        panel: 'feature_table',
        module: 'hs.feature-table',
        order: 14,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.FEATURE_TABLE'),
        description: () =>
          this.HsLanguageService.getTranslation(
            'SIDEBAR.descriptions.FEATURE_TABLE'
          ),
        icon: 'icon-indexmanager',
      },
      {
        panel: 'mobile_settings',
        module: 'hs.mobile_settings.controller',
        order: 14,
        title: () =>
          this.HsLanguageService.getTranslation(
            'PANEL_HEADER.APPLICATIONSETTINGS'
          ),
        description: () =>
          this.HsLanguageService.getTranslation(
            'SIDEBAR.descriptions.APPLICATIONSETTINGS'
          ),
        icon: 'icon-settingsandroid',
      },
      {
        panel: 'search',
        module: 'HsSearchController',
        order: 15,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.SEARCH'),
        description: () =>
          this.HsLanguageService.getTranslation('SIDEBAR.descriptions.SEARCH'),
        icon: 'icon-search',
      },
      {
        panel: 'draw',
        module: 'hs.draw',
        order: 16,
        title: () => this.HsLanguageService.getTranslation('PANEL_HEADER.DRAW'),
        description: () =>
          this.HsLanguageService.getTranslation('SIDEBAR.descriptions.DRAW'),
        icon: 'icon-pencil',
      },
      {
        panel: 'tripPlanner',
        module: 'hs.trip_planner',
        order: 17,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.TRIP_PLANNER'),
        description: () =>
          this.HsLanguageService.getTranslation(
            'SIDEBAR.descriptions.TRIP_PLANNER'
          ),
        icon: 'icon-sextant',
      },
    ];

    this.HsEventBusService.mainPanelChanges.subscribe(() => {
      /* NOTE: WE used to update map size only 'if (!HsLayoutService.sidebarExpanded) {' 
      but that leads to blank margin between map and window border 
      (see https://github.com/hslayers/hslayers-ng/issues/1107). Using timer to take
      into account sidebar width changing animation. 
      */
      setTimeout(() => {
        this.HsCoreService.updateMapSize();
      }, 550);
    });
  }

  getButtonTitle(button): any {
    return typeof button.title == 'function' ? button.title() : button.title;
  }
  getButtonDescription(button): any {
    return typeof button.description == 'function'
      ? button.description()
      : button.description;
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
