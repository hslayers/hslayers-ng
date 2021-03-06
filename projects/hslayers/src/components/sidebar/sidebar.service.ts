import {HsButton} from './button.interface';
import {HsConfig} from './../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
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
  miniSidebarButton = {
    title: () =>
      this.HsLanguageService.getTranslation('SIDEBAR.additionalPanels'),
  };
  numberOfUnimportant: number;
  importantButtons: HsButton[];

  constructor(
    public HsLayoutService: HsLayoutService,
    public HsConfig: HsConfig,
    public HsLanguageService: HsLanguageService,
    public HsCoreService: HsCoreService,
    public HsEventBusService: HsEventBusService,
    public HsUtilsService: HsUtilsService
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
        fits: true,
        title: () => this.HsLanguageService.getTranslation('PANEL_HEADER.LM'),
        description: () =>
          this.HsLanguageService.getTranslation('SIDEBAR.descriptions.LM'),
        icon: 'icon-layers',
      },
      {
        panel: 'legend',
        module: 'hs.legend',
        order: 1,
        fits: true,
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
        fits: true,
        title: () => this.HsLanguageService.getTranslation('PANEL_HEADER.INFO'),
        description: () =>
          this.HsLanguageService.getTranslation('SIDEBAR.descriptions.INFO'),
        icon: 'icon-info-sign',
      },
      {
        panel: 'composition_browser',
        module: 'hs.compositions',
        order: 3,
        fits: true,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.MAPCOMPOSITIONS'),
        description: () =>
          this.HsLanguageService.getTranslation(
            'SIDEBAR.descriptions.MAPCOMPOSITIONS'
          ),
        icon: 'icon-map',
      },
      {
        panel: 'addData',
        module: 'hs.addData',
        order: 4,
        fits: true,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.ADDLAYERS'),
        description: () =>
          this.HsLanguageService.getTranslation(
            'SIDEBAR.descriptions.ADDLAYERS'
          ),
        icon: 'icon-database',
      },
      {
        panel: 'measure',
        module: 'hs.measure',
        order: 2,
        fits: true,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.MEASURE'),
        description: () =>
          this.HsLanguageService.getTranslation('SIDEBAR.descriptions.MEASURE'),
        icon: 'icon-design',
        condition: true,
      },
      {
        panel: 'print',
        module: 'hs.print',
        order: 10,
        fits: true,
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
        fits: true,
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
        fits: true,
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
        fits: true,
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
        fits: true,
        title: () =>
          this.HsLanguageService.getTranslation('PANEL_HEADER.FEATURE_TABLE'),
        description: () =>
          this.HsLanguageService.getTranslation(
            'SIDEBAR.descriptions.FEATURE_TABLE'
          ),
        icon: 'icon-indexmanager',
      },
      // {
      //   panel: 'mobile_settings',
      //   module: 'hs.mobile_settings.controller',
      //   order: 14,
      //   fits: true,
      //   title: () =>
      //     this.HsLanguageService.getTranslation(
      //       'PANEL_HEADER.APPLICATIONSETTINGS'
      //     ),
      //   description: () =>
      //     this.HsLanguageService.getTranslation(
      //       'SIDEBAR.descriptions.APPLICATIONSETTINGS'
      //     ),
      //   icon: 'icon-settingsandroid',
      // },
      {
        panel: 'search',
        module: 'hs.search',
        order: 15,
        fits: true,
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
        fits: true,
        title: () => this.HsLanguageService.getTranslation('PANEL_HEADER.DRAW'),
        description: () =>
          this.HsLanguageService.getTranslation('SIDEBAR.descriptions.DRAW'),
        icon: 'icon-pencil',
      },
      {
        panel: 'tripPlanner',
        module: 'hs.trip_planner',
        order: 17,
        fits: true,
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

    this.HsEventBusService.layoutLoads.subscribe(() => {
      this.setButtonVisibility();

      //After initial run update sidebar with each layoutResizes event
      this.HsEventBusService.layoutResizes.subscribe(() => {
        this.setButtonVisibility();
      });
    });
  }

  setButtonVisibility() {
    this.importantButtons = this.buttons.filter((button) => {
      return (
        button.important != false && this.visibleButtons.includes(button.panel)
      );
    });
    this.numberOfUnimportant =
      this.buttons.length - this.importantButtons.length;
    for (const button of this.importantButtons) {
      button.fits = this.fitsSidebar(button);
    }
    if (!this.unimportantExist) {
      this.HsLayoutService.minisidebar = this.importantButtons.some(
        (b) => b.fits == false
      );
    }
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
   * @param panelName
   * @param state
   */
  setButtonImportancy(panelName: string, state: boolean): void {
    const backCompat = {datasource_selector: 'addData'};
    panelName = backCompat[panelName] ? backCompat[panelName] : panelName;
    const button = this.buttons.find((b) => b.panel == panelName);
    if (button) {
      //Unimportant buttons are automatically placed inside minisidebar
      button.fits = state;
      button.important = state;
    }

    this.unimportantExist = this.buttons.some((b) => b.important == false);
    this.HsLayoutService.minisidebar = this.unimportantExist;
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
        this.HsLayoutService.getPanelEnableState(button.panel) &&
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
  fitsSidebar(button: HsButton): boolean {
    const dimensionToCheck =
      window.innerWidth > 767 ? 'clientHeight' : 'clientWidth';

    let maxNumberofButtons = Math.floor(
      this.HsLayoutService.layoutElement[dimensionToCheck] / 60
    );
    maxNumberofButtons =
      dimensionToCheck == 'clientHeight'
        ? maxNumberofButtons - 1
        : maxNumberofButtons;

    return (
      this.importantButtons.findIndex((btn) => btn.panel === button.panel) +
        2 <=
      maxNumberofButtons
    );
  }
}
