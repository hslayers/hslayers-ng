import {HsButton} from './button.interface';
import {HsConfig} from './../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
import {Subject, debounceTime} from 'rxjs';

class HsSidebarParams {
  extraButtons: Array<HsButton> = [];
  /**
   * List of sidebar buttons
   */
  buttons: Array<HsButton> = [];
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

  constructor() {}
}

@Injectable({
  providedIn: 'root',
})
export class HsSidebarService {
  apps: {
    [id: string]: HsSidebarParams;
  } = {default: new HsSidebarParams()};
  sidebarLoad: Subject<string> = new Subject();

  miniSidebarButton = {
    title: () =>
      this.HsLanguageService.getTranslation('SIDEBAR.additionalPanels'),
  };

  get(app: string): HsSidebarParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsSidebarParams();
    }
    return this.apps[app ?? 'default'];
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

    //FIXME: STILL NOT WORKING AS EXPECTED WHEN MAP HEIGHT IS SMALLER
    //BUTTONS WHICH ARE OVERFLOWING ARE NOT HIDDEN IN MINISIDEBAR
    this.HsEventBusService.layoutLoads.subscribe((data) => {
      //Timeout because without it the buttons are not loaded yet
      setTimeout(() => {
        //Looping because layoutLoads for the first app is being triggered before the subscribtion
        for (const [appName, value] of Object.entries(this.HsConfig.apps)) {
          this.setButtonVisibility(appName);
          this.setPanelState(this.get(appName).buttons, appName);
        }
      });

      //After initial run update sidebar with each layoutResizes event
      if (data.element) {
        this.HsEventBusService.layoutResizes.subscribe(() => {
          //Looping because layoutLoads for the first app is being triggered before the subscribtion
          for (const [appName, value] of Object.entries(this.HsConfig.apps)) {
            this.setButtonVisibility(appName);
          }
        });
      }
    });
  }

  setButtonVisibility(app: string) {
    this.get(app).importantButtons = this.get(app).buttons.filter((button) => {
      return (
        button.important != false &&
        this.get(app).visibleButtons.includes(button.panel)
      );
    });
    this.get(app).numberOfUnimportant =
      this.get(app).buttons.length - this.get(app).importantButtons.length;
    for (const button of this.get(app).importantButtons) {
      button.fits = this.fitsSidebar(button, app);
    }
    if (!this.get(app).unimportantExist) {
      this.HsLayoutService.get(app).minisidebar = this.get(
        app
      ).importantButtons.some((b) => b.fits == false);
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
  setButtonImportancy(panelName: string, state: boolean, app: string): void {
    const backCompat = {datasource_selector: 'addData'};
    panelName = backCompat[panelName] ? backCompat[panelName] : panelName;
    const button = this.get(app).buttons.find((b) => b.panel == panelName);
    if (button) {
      //Unimportant buttons are automatically placed inside minisidebar
      button.fits = state;
      button.important = state;
    }

    this.get(app).unimportantExist = this.get(app).buttons.some(
      (b) => b.important == false
    );
    this.HsLayoutService.get(app).minisidebar = this.get(app).unimportantExist;
  }
  buttonClicked(button: HsButton, app: string): void {
    if (button.click) {
      button.click();
    } else {
      this.HsLayoutService.setMainPanel(button.panel, app, true);
    }
  }
  setPanelState(buttons: Array<HsButton>, app: string): void {
    if (buttons.length == 0) {
      return;
    }
    for (const button of buttons) {
      if (
        this.HsLayoutService.getPanelEnableState(button.panel, app) &&
        this.checkConfigurableButtons(button, app)
      ) {
        if (!this.get(app).visibleButtons.includes(button.panel)) {
          this.get(app).visibleButtons.push(button.panel);
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
    const dimensionToCheck =
      window.innerWidth > 767 ? 'clientHeight' : 'clientWidth';
    this.HsLayoutService.get(app).sidebarToggleable = window.innerWidth > 767;
    let maxNumberOfButtons = Math.floor(
      this.HsLayoutService.get(app).layoutElement[dimensionToCheck] / 60
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
