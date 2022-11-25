import {BehaviorSubject, Observable, Subject, take} from 'rxjs';
import {Injectable} from '@angular/core';

import {HsButton} from './button.interface';
import {HsConfig} from './../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsUtilsService} from '../utils/utils.service';

export class HsSidebarParams {
  extraButtons: Array<HsButton> = [];
  buttonsSubject: BehaviorSubject<HsButton[]> = new BehaviorSubject([]);
  /**
   * List of sidebar buttons
   */
  buttons: Observable<HsButton[]>;
  /**
   * If buttons with importancy property exist.
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

  constructor() {
    this.buttons = this.buttonsSubject.asObservable();
  }
}

@Injectable({
  providedIn: 'root',
})
export class HsSidebarService {
  apps: {
    [id: string]: HsSidebarParams;
  } = {default: new HsSidebarParams()};
  sidebarLoad: Subject<string> = new Subject();

  get(app: string = 'default'): HsSidebarParams {
    if (this.apps[app] == undefined) {
      this.apps[app] = new HsSidebarParams();
    }
    return this.apps[app];
  }

  constructor(
    public HsLayoutService: HsLayoutService,
    public HsConfig: HsConfig,
    public HsLanguageService: HsLanguageService,
    public HsCoreService: HsCoreService,
    public HsEventBusService: HsEventBusService,
    public HsUtilsService: HsUtilsService
  ) {
    this.HsEventBusService.mainPanelChanges.subscribe(({which, app}) => {
      /* NOTE: WE used to update map size only 'if (!HsLayoutService.sidebarExpanded) {' 
      but that leads to blank margin between map and window border 
      (see https://github.com/hslayers/hslayers-ng/issues/1107). Using timer to take
      into account sidebar width changing animation. 
      */
      setTimeout(() => {
        this.HsCoreService.updateMapSize(app);
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

  setButtonVisibility(buttons: HsButton[], app: string) {
    const appRef = this.get(app);
    if (this.HsLayoutService.get(app).layoutElement == undefined) {
      setTimeout(() => this.setButtonVisibility(buttons, app), 100);
      return;
    }
    appRef.importantButtons = buttons.filter((button) => {
      return (
        button.important != false &&
        appRef.visibleButtons.includes(button.panel)
      );
    });
    appRef.numberOfUnimportant =
      buttons.length - appRef.importantButtons.length;
    for (const button of appRef.importantButtons) {
      button.fits = this.fitsSidebar(button, app);
    }
    if (!appRef.unimportantExist) {
      this.HsLayoutService.get(app).minisidebar = this.get(
        app
      ).importantButtons.some((b) => b.fits == false);
    }
  }

  addButton(button: HsButton, app?: string) {
    this.get(app ?? 'default')
      .buttons.pipe(take(1))
      .subscribe((cur) => {
        this.get(app ?? 'default').buttonsSubject.next([...cur, button]);
      });
  }

  /**
   * Function to set if a button is important and always visible
   * or only when the sidebar buttons are expanded
   *
   * @param panelName
   * @param state
   */
  setButtonImportancy(
    buttons: HsButton[],
    panelName: string,
    state: boolean,
    app: string = 'default'
  ): void {
    const appRef = this.get(app);
    const backCompat = {datasource_selector: 'addData'};
    panelName = backCompat[panelName] ? backCompat[panelName] : panelName;
    const button = buttons.find((b) => b.panel == panelName);
    if (button) {
      //Unimportant buttons are automatically placed inside minisidebar
      button.fits = state;
      button.important = state;
    }

    appRef.unimportantExist = buttons.some((b) => b.important == false);
    this.HsLayoutService.get(app).minisidebar = appRef.unimportantExist;
  }
  buttonClicked(button: HsButton, app: string): void {
    if (button.click) {
      button.click();
    } else {
      this.HsLayoutService.setMainPanel(button.panel, app, true);
    }
  }
  setPanelState(buttons: Array<HsButton>, app: string): void {
    const appRef = this.get(app);
    if (buttons.length == 0) {
      return;
    }
    for (const button of buttons) {
      if (
        this.HsLayoutService.getPanelEnableState(button.panel, app) &&
        this.checkConfigurableButtons(button, app)
      ) {
        if (!appRef.visibleButtons.includes(button.panel)) {
          appRef.visibleButtons.push(button.panel);
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
   * @param {object} button buttons Buttons object
   */
  checkConfigurableButtons(button: HsButton, app: string): boolean {
    if (typeof button.condition == 'undefined') {
      return true;
    } else if (!this.HsConfig.get(app).panelsEnabled) {
      return false;
    } else {
      return this.HsConfig.get(app).panelsEnabled[button.panel];
    }
  }

  /**
   * @public
   * @param {string} which Sidear button to be checked (specify panel name)
   * @description Check if sidebar button should be visible in classic sidebar or hidden inside minisidebar panel
   * @description Toggles minisidebar button
   */
  fitsSidebar(button: HsButton, app: string): boolean {
    const mobileBreakpoint = this.HsConfig.get(app).mobileBreakpoint;
    const dimensionToCheck =
      window.innerWidth > mobileBreakpoint ? 'clientHeight' : 'clientWidth';
    this.HsLayoutService.get(app).sidebarToggleable =
      window.innerWidth > mobileBreakpoint;
    let maxNumberOfButtons = Math.floor(
      this.HsLayoutService.get(app).layoutElement[dimensionToCheck] / 65
    );
    maxNumberOfButtons =
      dimensionToCheck == 'clientHeight'
        ? maxNumberOfButtons - 1
        : maxNumberOfButtons;

    return (
      this.get(app).importantButtons.findIndex(
        (btn) => btn.panel === button.panel
      ) +
        2 <=
      maxNumberOfButtons
    );
  }
}
