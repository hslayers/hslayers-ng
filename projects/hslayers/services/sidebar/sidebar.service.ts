import {BehaviorSubject, Observable, Subject, take} from 'rxjs';
import {Injectable} from '@angular/core';

import {HsButton} from 'hslayers-ng/types';
import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsUtilsService} from 'hslayers-ng/services/utils';

@Injectable({
  providedIn: 'root',
})
export class HsSidebarService {
  buttonDefinition = {
    'mapSwipe': {
      panel: 'mapSwipe',
      module: 'hs.mapSwipe',
      order: 18,
      fits: true,
      title: 'PANEL_HEADER.MAP_SWIPE',
      description: 'SIDEBAR.descriptions.MAP_SWIPE',
      icon: 'icon-resizehorizontalalt',
    },
    'layerManager': {
      panel: 'layerManager',
      module: 'hs.layermanager',
      order: 0,
      fits: true,
      title: 'PANEL_HEADER.LM',
      description: 'SIDEBAR.descriptions.LM',
      icon: 'icon-layers',
    },
    'legend': {
      panel: 'legend',
      module: 'hs.legend',
      order: 1,
      fits: true,
      title: 'PANEL_HEADER.LEGEND',
      description: 'SIDEBAR.descriptions.LEGEND',
      icon: 'icon-dotlist',
    },
    'addData': {
      panel: 'addData',
      module: 'hs.addData',
      order: 4,
      fits: true,
      title: 'PANEL_HEADER.ADDLAYERS',
      description: 'SIDEBAR.descriptions.ADDLAYERS',
      icon: 'icon-database',
    },
    'compositions': {
      panel: 'compositions',
      module: 'hs.compositions',
      order: 3,
      fits: true,
      title: 'PANEL_HEADER.MAPCOMPOSITIONS',
      description: 'SIDEBAR.descriptions.MAPCOMPOSITIONS',
      icon: 'icon-map',
    },
    'draw': {
      panel: 'draw',
      module: 'hs.draw',
      order: 16,
      fits: true,
      title: 'PANEL_HEADER.draw',
      description: 'SIDEBAR.descriptions.DRAW',
      icon: 'icon-pencil',
    },
    'language': {
      panel: 'language',
      module: 'hs.language',
      order: 13,
      fits: true,
      title: 'PANEL_HEADER.LANGUAGE',
      description: 'SIDEBAR.descriptions.LANGUAGE',
      content: () => {
        return this.HsLanguageService.getCurrentLanguageCode().toUpperCase();
      },
    },
    'share': {
      panel: 'share',
      module: 'hs.permalink',
      order: 11,
      fits: true,
      title: 'PANEL_HEADER.PERMALINK',
      description: 'SIDEBAR.descriptions.PERMALINK',
      icon: 'icon-share-alt',
    },
    'print': {
      panel: 'print',
      module: 'hs.print',
      order: 10,
      fits: true,
      title: 'PANEL_HEADER.PRINT',
      description: 'SIDEBAR.descriptions.PRINT',
      icon: 'icon-print',
    },
    'query': {
      panel: 'query',
      module: 'hs.query',
      order: 7,
      fits: true,
      title: 'PANEL_HEADER.INFO',
      description: 'SIDEBAR.descriptions.INFO',
      icon: 'icon-info-sign',
    },
    'saveMap': {
      panel: 'saveMap',
      module: 'hs.save-map',
      order: 12,
      fits: true,
      title: 'PANEL_HEADER.SAVECOMPOSITION',
      description: 'SIDEBAR.descriptions.SAVECOMPOSITION',
      icon: 'icon-save-floppy',
    },
    'measure': {
      panel: 'measure',
      module: 'hs.measure',
      order: 2,
      fits: true,
      title: 'PANEL_HEADER.MEASURE',
      description: 'SIDEBAR.descriptions.MEASURE',
      icon: 'icon-design',
      condition: true,
    },
    'search': {
      panel: 'search',
      module: 'hs.search',
      order: 15,
      fits: true,
      title: 'PANEL_HEADER.SEARCH',
      description: 'SIDEBAR.descriptions.SEARCH',
      icon: 'icon-search',
      condition: true,
    },
    'tripPlanner': {
      panel: 'tripPlanner',
      module: 'hs-trip-planner',
      order: 17,
      fits: true,
      title: 'PANEL_HEADER.TRIP_PLANNER',
      description: 'SIDEBAR.descriptions.TRIP_PLANNER',
      icon: 'icon-sextant',
    },
    'wfsFilter': {
      panel: 'wfsFilter',
      order: 0,
      fits: true,
      title: 'PANEL_HEADER.WFS_FILTER',
      description: 'SIDEBAR.descriptions.WFS_FILTER',
      icon: 'icon-filter',
    },
  };

  extraButtons: Array<HsButton> = [];
  buttonsSubject: BehaviorSubject<HsButton[]> = new BehaviorSubject([]);
  /**
   * List of sidebar buttons
   */
  buttons: Observable<HsButton[]>;
  /**
   * If buttons with importance property exist.
   * If not, don't display expansion +/- icon
   */
  unimportantExist = false;
  /**
   * List of visible buttons taking into account viewport size
   */
  visibleButtons: Array<HsButton> = [];
  showUnimportant: boolean;
  numberOfUnimportant: number;
  importantButtons: HsButton[];
  sidebarLoad: Subject<void> = new Subject();

  destroy(): void {
    /**
     * Clean up/reset buttons entries
     */
    this.buttonsSubject.next([]);
  }

  constructor(
    public HsLayoutService: HsLayoutService,
    public hsConfig: HsConfig,
    public HsLanguageService: HsLanguageService,
    public HsEventBusService: HsEventBusService,
    public HsUtilsService: HsUtilsService,
  ) {
    this.buttons = this.buttonsSubject.asObservable();
    this.HsLayoutService.mainpanel$.subscribe((which) => {
      /* NOTE: WE used to update map size only 'if (!HsLayoutService.sidebarExpanded) {' 
      but that leads to blank margin between map and window border 
      (see https://github.com/hslayers/hslayers-ng/issues/1107). Using timer to take
      into account sidebar width changing animation. 
      */
      setTimeout(() => {
        this.HsEventBusService.mapSizeUpdates.next();
      }, 550);
    });
  }

  prepareForTemplate(buttons: HsButton[]): HsButton[] {
    const tmp = buttons.map((button) => {
      if (typeof button.title == 'function') {
        button.title = button.title();
      }
      if (typeof button.description == 'function') {
        button.description = button.description();
      }
      return button;
    });
    tmp.sort((a, b) => a.order - b.order);
    return tmp;
  }

  setButtonVisibility(buttons: HsButton[]) {
    if (this.HsLayoutService.layoutElement == undefined) {
      setTimeout(() => this.setButtonVisibility(buttons), 100);
      return;
    }
    this.importantButtons = buttons.filter((button) => {
      return (
        button.important != false && this.visibleButtons.includes(button.panel)
      );
    });
    this.numberOfUnimportant = buttons.length - this.importantButtons.length;
    for (const button of this.importantButtons) {
      button.fits = this.fitsSidebar(button);
    }
    if (!this.unimportantExist) {
      this.HsLayoutService.minisidebar = this.importantButtons.some(
        (b) => b.fits == false,
      );
    }
  }

  addButton(button: HsButton) {
    this.buttons.pipe(take(1)).subscribe((cur) => {
      /**
       * Don't add button for measure or search in case their toolbar
       * alternatives are active
       */
      if (
        button.condition &&
        this.HsLayoutService.componentEnabled(`${button.panel}Toolbar`)
      ) {
        return;
      }
      this.buttonsSubject.next([...cur, button]);
    });
  }

  /**
   * Function to set if a button is important and always visible
   * or only when the sidebar buttons are expanded
   */
  setButtonImportance(
    buttons: HsButton[],
    panelName: string,
    state: boolean,
  ): void {
    const backCompat = {datasource_selector: 'addData'};
    panelName = backCompat[panelName] ? backCompat[panelName] : panelName;
    const button = buttons.find((b) => b.panel == panelName);
    if (button) {
      //Unimportant buttons are automatically placed inside minisidebar
      button.fits = state;
      button.important = state;
    }

    this.unimportantExist = buttons.some((b) => b.important == false);
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
    if (buttons.length == 0) {
      return;
    }
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
   * @param button - Buttons object
   */
  checkConfigurableButtons(button: HsButton): boolean {
    if (typeof button.condition == 'undefined') {
      return true;
    } else if (!this.hsConfig.panelsEnabled) {
      return false;
    } else {
      return this.hsConfig.panelsEnabled[button.panel];
    }
  }

  /**
   * Check if sidebar button should be visible in classic sidebar or hidden inside minisidebar panel
   * Toggles minisidebar button
   * @public
   * @param which - Sidebar button to be checked (specify panel name)
   */
  fitsSidebar(button: HsButton): boolean {
    const mobileBreakpoint = this.hsConfig.mobileBreakpoint;
    const dimensionToCheck =
      this.HsLayoutService.layoutElement.clientWidth > mobileBreakpoint
        ? 'clientHeight'
        : 'clientWidth';
    this.HsLayoutService.sidebarToggleable =
      this.hsConfig.sidebarToggleable &&
      this.HsLayoutService.layoutElement.clientWidth > mobileBreakpoint;
    let maxNumberOfButtons = Math.floor(
      this.HsLayoutService.layoutElement[dimensionToCheck] / 65,
    );
    maxNumberOfButtons =
      dimensionToCheck == 'clientHeight'
        ? maxNumberOfButtons - 1
        : maxNumberOfButtons;

    return (
      this.importantButtons.findIndex((btn) => btn.panel === button.panel) +
        2 <=
      maxNumberOfButtons
    );
  }
}
