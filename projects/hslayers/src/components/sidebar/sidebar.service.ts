import {BehaviorSubject, Observable, Subject, take} from 'rxjs';
import {Injectable} from '@angular/core';

import {HsButton} from './button.interface';
import {HsConfig} from './../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsUtilsService} from '../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsSidebarService {
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
    public HsCoreService: HsCoreService,
    public HsEventBusService: HsEventBusService,
    public HsUtilsService: HsUtilsService,
  ) {
    this.buttons = this.buttonsSubject.asObservable();
    this.HsEventBusService.mainPanelChanges.subscribe((which) => {
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
      this.buttonsSubject.next([...cur, button]);
    });
  }

  /**
   * Function to set if a button is important and always visible
   * or only when the sidebar buttons are expanded
   */
  setButtonImportancy(
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
