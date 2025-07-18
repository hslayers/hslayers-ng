import {BehaviorSubject, Observable, Subject, delay, map, skip} from 'rxjs';
import {ElementRef, Injectable, Type, ViewContainerRef} from '@angular/core';

import {HsConfig, DefaultPanel} from 'hslayers-ng/config';
import {HsLogService} from 'hslayers-ng/services/log';

export class HsLayoutParams {
  _puremapApp: BehaviorSubject<boolean>;
  /**
   * Storage of default main panel.
   * This panel is opened during initialization of app and also when other panel than default is closed.
   * @default ''
   */
  defaultPanel: string;
  /**
   * Set panel visibility statuses. Multiple panels can be open at the same time this way
   */
  panel_statuses: any;
  /**
   * DEPRECATED?
   */
  panel_enabled: any;
  /**
   * Side on which sidebar will be shown (true = right side of map, false = left side of map)
   * @default true
   */
  sidebarRight: boolean;
  /**
   * Whether to display labels of sidebar buttons or not.
   * Used in CSS classes assertion on hs-panelspace.
   * @default true
   */
  sidebarLabels: boolean;
  /**
   * Enable sidebar function to open/close sidebar (if false sidebar panel cannot be opened/closed through GUI)
   * @default true
   */
  sidebarToggleable: boolean;
  /**
   * Show if any sidebar panel is opened (sidebar is completely expanded).
   * When hs.sidebar module is used in the app, it changes automatically to true during initialization.
   * @default false
   */
  sidebarExpanded: boolean;
  /**
   * Show if minisidebar panel is visible in sidebar, allows sidebar to be visible in panelspace
   * @default false
   */
  initializedOnce: boolean;
  /**
   * Whether the app has been initialized already once.
   * Need this to not add panels twice when NgRouter is used
   * @default false
   */
  minisidebar: boolean;
  contentWrapper?: any;
  layoutElement?: any;
  sidebarVisible: Observable<boolean>;
  sidebarPosition: Observable<string>;
  sidebarVisible$: BehaviorSubject<boolean>;
  sidebarPosition$: BehaviorSubject<string>;

  mainpanel$: BehaviorSubject<string>;

  get mainpanel() {
    return this.mainpanel$.getValue();
  }

  constructor() {
    this.defaultPanel = '';
    this.panel_statuses = {};
    this.panel_enabled = {};
    this.sidebarRight = true;
    this.sidebarLabels = true;
    this.sidebarToggleable = true;
    this.sidebarExpanded = false;
    this.initializedOnce = false;
    this.minisidebar = false;
  }
}

@Injectable({
  providedIn: 'root',
})
export class HsLayoutService extends HsLayoutParams {
  mapSpaceRef: BehaviorSubject<ViewContainerRef> = new BehaviorSubject(
    undefined,
  );
  _puremapApp = new BehaviorSubject<boolean>(false);
  /**
   * Whether app is running in puremapApp mode
   */
  get puremapApp() {
    return this._puremapApp.getValue();
  }

  set puremapApp(val: boolean) {
    this._puremapApp.next(val);
  }

  panelSpaceWidth = new BehaviorSubject<number>(425);

  sidebarPosition$ = new BehaviorSubject('left');
  sidebarVisible$ = new BehaviorSubject(true);
  mainpanel$: BehaviorSubject<DefaultPanel> = new BehaviorSubject(undefined);

  layoutLoads: Subject<{element: any; innerElement: string}> = new Subject();

  constructor(
    public hsConfig: HsConfig,
    public $log: HsLogService,
  ) {
    super();
    Object.defineProperty(this, 'panelListElement', {
      get: function () {
        return this.contentWrapper.querySelector('.hs-panelplace');
      },
    });

    Object.defineProperty(this, 'dialogAreaElement', {
      get: function () {
        return this.contentWrapper.querySelector('.hs-dialog-area');
      },
    });

    Object.defineProperty(this, 'sidebarListElement', {
      get: function () {
        return this.contentWrapper.querySelector('.hs-sidebar-list');
      },
    });

    this.parseConfig();
    this.hsConfig.configChanges.subscribe(() => {
      this.parseConfig();
    });

    this.mainpanel$.pipe(skip(1)).subscribe((which) => {
      this.updPanelSpaceWidth();
    });

    this.layoutLoads.subscribe(() => {
      this.updPanelSpaceWidth();
      this.updSidebarPosition();
      this.updSidebarVisible(true);
    });

    this.sidebarVisible = this.sidebarVisible$.pipe(
      delay(0),
      map((visible) => visible),
    );
    this.sidebarPosition = this.sidebarPosition$.pipe(
      delay(0),
      map((position) => position),
    );
  }

  updPanelSpaceWidth() {
    //Timeout to repaint first to get width from element clientWidth
    setTimeout(() => {
      this.panelSpaceWidth.next(this.getPanelSpaceWidth());
    }, 0);
  }

  async updSidebarPosition() {
    const lastPosition = this.sidebarPosition$.getValue();
    const hslElement = this.layoutElement;
    if (hslElement.clientWidth <= this.hsConfig.mobileBreakpoint) {
      hslElement.classList.add('hs-mobile-view');
      if (lastPosition != 'bottom') {
        this.sidebarPosition$.next('bottom');
      }
    } else {
      hslElement.classList.remove('hs-mobile-view');
      if (this.hsConfig.sidebarPosition != lastPosition) {
        this.sidebarPosition$.next(this.hsConfig.sidebarPosition);
      }
    }
  }

  parseConfig() {
    this.panel_enabled = {};
    if (this.hsConfig) {
      for (const key of Object.keys(this.hsConfig.panelsEnabled)) {
        this.panelEnabled(key, this.getPanelEnableState(key));
      }
      this.sidebarToggleable = this.hsConfig.hasOwnProperty('sidebarToggleable')
        ? this.hsConfig.sidebarToggleable
        : true;
      if (this.hsConfig.defaultPanel && !this.hsConfig.sidebarClosed) {
        this.setMainPanel(this.hsConfig.defaultPanel);
      }
    }

    this.sidebarPosition$.next(this.hsConfig?.sidebarPosition ?? 'left');
  }

  getPanelEnableState(panel): boolean {
    if (
      this.hsConfig?.panelsEnabled == undefined ||
      this.hsConfig?.panelsEnabled[panel] == undefined
    ) {
      /* 
      Function called from sidebar and panel is 
      probably custom panel added to buttons array from outside 
      */
      return true;
    }
    return this.hsConfig.panelsEnabled[panel];
  }

  /**
   * Close opened panel programmatically.
   * If sidebar toolbar is used in the app, sidebar stays expanded with sidebar labels.
   */
  hidePanels() {
    this.sidebarLabels = true;
    this.mainpanel$.next(undefined);
  }

  /**
   * Get or set panel visibility in sidebar.
   * When panel is disabled it means that it's not displayed in sidebar (it can be opened programmatically) but its functionality is running.
   * Use with status parameter as setter.
   * @param which - Selected panel (panel name)
   * @param status - Visibility status of panel to set
   * @returns Panel enabled/disabled status for getter function
   */
  panelEnabled(which: string, status?: boolean): boolean {
    if (status === undefined) {
      if (this.panel_enabled[which] != undefined) {
        return this.panel_enabled[which];
      }
      return true;
    }
    this.panel_enabled[which] = status;
  }

  /**
   * Wrapper for accessing hsConfig.componentsEnabled settings.
   * @param which - Name of the GUI component to check
   * @returns true if set to true (default), false otherwise
   */
  componentEnabled(which: string): boolean {
    return (
      this.hsConfig.componentsEnabled == undefined ||
      this.hsConfig.componentsEnabled[which] == undefined ||
      this.hsConfig.componentsEnabled[which]
    );
  }

  /**
   * Sets new main panel (Panel displayed in expanded sidebar).
   * Change GUI and queryable status of map (when queryable and with hs.query component in the app, the map does info query on map click).
   * @param which - New panel to activate (panel name)
   * @param byGui - Whether function call came as result of GUI action
   */
  setMainPanel(which: string, byGui?: boolean): void {
    if (which == this.mainpanel && byGui) {
      which = '';
      if (this.sidebarExpanded == true) {
        if (this.sidebarPosition$.getValue() == 'bottom') {
          this.sidebarExpanded = false;
        } else {
          this.sidebarLabels = true;
        }
      }
    } else {
      this.sidebarExpanded = true;
      this.sidebarLabels = false;
    }
    this.mainpanel$.next(which);
  }

  getPanelSpaceWidth(): number {
    const panelSpaceWidth = this.layoutElement.getElementsByClassName(
      'hs-panelspace-wrapper',
    )[0].clientWidth;
    return panelSpaceWidth;
  }

  async updSidebarVisible(visible?: boolean): Promise<void> {
    if (
      this.hsConfig.sidebarPosition == 'invisible' ||
      this.hsConfig.pureMap ||
      this.hsConfig.componentsEnabled.guiOverlay === false ||
      this.hsConfig.componentsEnabled.sidebar === false
    ) {
      return this.sidebarVisible$.next(false);
    }
    if (visible == undefined) {
      this.sidebarVisible$.next(true);
    } else {
      this.sidebarVisible$.next(visible);
    }
  }

  panelSpaceHeight() {
    if (this.contentWrapper.querySelector('.hs-panelspace-wrapper')) {
      return this.contentWrapper.querySelector('.hs-panelspace-wrapper')
        .clientHeight;
      // return tmp
    }
  }

  addMapVisualizer(visualizerComponent: Type<unknown>): void {
    this.mapSpaceRef.subscribe((viewContainerRef) => {
      if (viewContainerRef) {
        const componentRef: any =
          viewContainerRef.createComponent(visualizerComponent);
      }
    });
  }

  // createPanel(panelComponent: Type<any>, data?: any): void {
  //   this.hsPanelContainerService.create(panelComponent, data || {});
  // }

  // createOverlay(panelComponent: Type<any>, data?: any): void {
  //   this.HsOverlayConstructorService.create(panelComponent, data || {});
  // }

  scrollTo(el: ElementRef) {
    el.nativeElement.scrollIntoView({behavior: 'smooth'});
  }
}
