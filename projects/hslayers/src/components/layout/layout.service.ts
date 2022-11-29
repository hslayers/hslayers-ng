import {BehaviorSubject, delay, lastValueFrom} from 'rxjs';
import {
  ComponentFactoryResolver,
  ElementRef,
  Injectable,
  Type,
  ViewContainerRef,
} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLogService} from '../../common/log/log.service';
import {HsOverlayPanelContainerService} from './overlay-panel-container.service';
import {HsPanelComponent} from './panels/panel-component.interface';
import {HsPanelContainerService} from './panels/panel-container.service';

const defaultLayoutParams = {
  defaultPanel: '',
  panel_statuses: {},
  panel_enabled: {},
  mainpanel: '',
  sidebarRight: true,
  sidebarLabels: true,
  sidebarToggleable: true,
  sidebarButtons: true,
  smallWidth: false,
  sidebarExpanded: false,
  initializedOnce: false,
  minisidebar: false,
  sidebarVisible: true,
  sidebarPosition: 'left',
};

export type HsLayoutParams = {
  /**
   * Storage of default main panel.
   * This panel is opened during initialization of app and also when other panel than default is closed.
   * @public
   * @default ''
   */
  defaultPanel: string;
  /**
   * Set panel visibility statuses. Multiple panels can be open at the same time this way
   */
  panel_statuses: any;
  /**
   * @public
   * @description DEPRECATED?
   */
  panel_enabled: any;
  /**
   * Storage of current main panel (panel which is opened).
   * When {@link HsLayoutService#defaultPanel defaultPanel} is specified, main panel is set to it during HsCore initialization.
   * @public
   * @default ''
   */
  mainpanel: string;
  /**
   * Side on which sidebar will be shown (true = right side of map, false = left side of map)
   * @public
   * @default true
   */
  sidebarRight: boolean;
  /**
   * Whether to display labels of sidebar buttons or not.
   * Used in CSS classes assertion on hs-panelspace.
   * @public
   * @default true
   */
  sidebarLabels: boolean;
  /**
   * Enable sidebar function to open/close sidebar (if false sidebar panel cannot be opened/closed through GUI)
   * @public
   * @default true
   */
  sidebarToggleable: boolean;
  /**
   * DEPRECATED Always true
   * @public
   * @deprecated
   * @default true
   */
  sidebarButtons: boolean;
  /**
   * DEPRECATED Helper property for showing some button on smaller screens
   * @public
   * @deprecated
   * @default false
   */
  smallWidth: boolean;
  /**
   * Show if any sidebar panel is opened (sidebar is completely expanded).
   * When hs.sidebar module is used in app, it change automatically to true during initialization.
   * @public
   * @default false
   */
  sidebarExpanded: boolean;
  /**
   * Show if minisidebar panel is visible in sidebar, allows sidebar to be visible in panelspace
   * @public
   * @default false
   */
  initializedOnce: boolean;
  /**
   * Whether the app has been initialized already once.
   * Need this to not add panels wtice when NgRouter is used
   * @public
   * @default false
   */
  minisidebar: boolean;
  contentWrapper?: any;
  layoutElement?: any;
  sidebarVisible: boolean;
  sidebarPosition: string;
};

@Injectable({
  providedIn: 'root',
})
export class HsLayoutService {
  apps: {
    [key: string]: HsLayoutParams;
  } = {};

  mapSpaceRef: BehaviorSubject<{
    viewContainerRef: ViewContainerRef;
    app: string;
  }> = new BehaviorSubject(undefined);

  panelSpaceWidth = new BehaviorSubject<{app: string; width: number}>({
    app: 'default',
    width: 425,
  });

  sidebarPosition = new BehaviorSubject<{app: string; position: string}>({
    app: 'default',
    position: 'left',
  });

  sidebarVisible = new BehaviorSubject<{app: string; visible: boolean}>({
    app: 'default',
    visible: true,
  });

  constructor(
    public HsConfig: HsConfig,
    public HsEventBusService: HsEventBusService,
    public $log: HsLogService,
    private componentFactoryResolver: ComponentFactoryResolver,
    public hsPanelContainerService: HsPanelContainerService,
    public hsOverlayPanelContainerService: HsOverlayPanelContainerService
  ) {
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
  }

  init(_app: string): void {
    this.parseConfig(_app);
    this.HsConfig.configChanges.subscribe(({app, config}) => {
      if (app == _app) {
        this.parseConfig(_app);
      }
    });
    this.HsEventBusService.mainPanelChanges.subscribe(({which, app}) => {
      this.updPanelSpaceWidth(app);
    });
    this.updPanelSpaceWidth(_app);
    this.updSidebarPosition(_app);
    this.updSidebarVisible(_app, true);
    this.sidebarVisible.pipe(delay(0)).subscribe(({app, visible}) => {
      this.apps[app].sidebarVisible = visible;
    });
    this.sidebarPosition.pipe(delay(0)).subscribe(({app, position}) => {
      this.apps[app].sidebarPosition = position;
    });
  }

  updPanelSpaceWidth(app: string) {
    //Timeout to repaint first to get width from element clientWidth
    setTimeout(() => {
      this.panelSpaceWidth.next({app, width: this.getPanelSpaceWidth(app)});
    }, 0);
  }

  async updSidebarPosition(app: string) {
    const appRef = this.get(app);
    const lastPosition = appRef.sidebarPosition;
    const config = this.HsConfig.apps[app];
    const hslElement = appRef.layoutElement;
    if (window.innerWidth <= config.mobileBreakpoint) {
      hslElement.classList.add('hs-mobile-view');
      if (lastPosition != 'bottom') {
        this.sidebarPosition.next({
          app,
          position: 'bottom',
        });
      }
    } else {
      hslElement.classList.remove('hs-mobile-view');
      if (config.sidebarPosition != lastPosition) {
        this.sidebarPosition.next({
          app,
          position: config.sidebarPosition,
        });
      }
    }
  }

  parseConfig(app: string) {
    const appRef = this.get(app);
    appRef.panel_enabled = {};
    const configRef = this.HsConfig.get(app);
    if (configRef) {
      for (const key of Object.keys(configRef.panelsEnabled)) {
        this.panelEnabled(key, app, this.getPanelEnableState(key, app));
      }
      appRef.sidebarToggleable = configRef.hasOwnProperty('sidebarToggleable')
        ? configRef.sidebarToggleable
        : true;
    }

    this.sidebarPosition.next({
      app,
      position: configRef?.sidebarPosition ?? 'left',
    });
  }

  getPanelEnableState(panel, app: string): boolean {
    if (
      this.HsConfig?.get(app).panelsEnabled == undefined ||
      this.HsConfig?.get(app).panelsEnabled[panel] == undefined
    ) {
      /* 
      Function called from sidebar and panel is 
      probably custom panel added to buttons array from outside 
      */
      return true;
    }
    return this.HsConfig.get(app).panelsEnabled[panel];
  }

  /**
   * Find if selected panel is currently opened (in sidebar or as unpinned window)
   * @param which - Which Name of panel to test
   * @param app - App name
   * @param panelComponent - Instance of panel component. Used for toggling multiple panels at the same time
   * @returns Panel opened/closed status
   */
  panelVisible(
    which: string,
    app: string = 'default',
    panelComponent?: HsPanelComponent
  ) {
    const appRef = this.get(app);
    if (panelComponent) {
      if (panelComponent.name == undefined) {
        panelComponent.name = which;
      }
    }
    if (appRef.panel_statuses[which] !== undefined) {
      return appRef.panel_statuses[which] && this.panelEnabled(which, app);
    }
    if (appRef.mainpanel == which) {
      return true;
    } else if (panelComponent) {
      return panelComponent.unpinned;
    } else {
      return false;
    }
  }

  /**
   * Close opened panel programmatically.
   * If sidebar toolbar is used in app, sidebar stay expanded with sidebar labels.
   * Cannot resolve unpinned panels.
   * @public
   */
  hidePanels(app) {
    const appRef = this.get(app);
    appRef.mainpanel = '';
    appRef.sidebarLabels = true;
    this.HsEventBusService.mainPanelChanges.next({app});
  }

  get(app: string = 'default'): HsLayoutParams {
    if (this.apps[app] == undefined) {
      this.apps[app] = Object.assign({}, defaultLayoutParams);
    }
    return this.apps[app];
  }

  /**
   * @public
   * @param {object} which Panel to close (panel scope)
   * @description Close selected panel (either unpinned panels or actual mainpanel). If default panel is defined, it is opened instead.
   */
  closePanel(which, app: string) {
    const appRef = this.get(app);
    if (which.unpinned) {
      appRef.contentWrapper
        .querySelector(which.original_container)
        .appendChild(which.drag_panel);
      which.drag_panel.css({
        top: 'auto',
        left: 'auto',
        position: 'relative',
      });
    }
    which.unpinned = false;
    if (which.panelName == appRef.mainpanel) {
      if (appRef.defaultPanel != '') {
        if (which.panelName == appRef.defaultPanel) {
          appRef.sidebarExpanded = false;
        } else {
          this.setMainPanel(appRef.defaultPanel, app);
        }
      } else {
        appRef.mainpanel = '';
        appRef.sidebarLabels = true;
      }
      appRef.sidebarExpanded = false;
    }

    this.HsEventBusService.mainPanelChanges.next({which, app});
  }

  /**
   * Get or set panel visibility in sidebar.
   * When panel is disabled it means that it's not displayed in sidebar (it can be opened programmatically) but its functionality is running.
   * Use with status parameter as setter.
   * @public
   * @param which - Selected panel (panel name)
   * @param status - Visibility status of panel to set
   * @returns Panel enabled/disabled status for getter function
   */
  panelEnabled(which: string, app: string, status?: boolean): boolean {
    const appRef = this.get(app);
    if (status === undefined) {
      if (appRef.panel_enabled[which] != undefined) {
        return appRef.panel_enabled[which];
      } else {
        return true;
      }
    } else {
      appRef.panel_enabled[which] = status;
    }
  }

  /**
   * Wrapper for accessing HsConfig.get(app).componentsEnabled settings.
   * @param which - Name of the GUI component to check
   * @returns true if set to true (default), false otherwise
   */
  componentEnabled(which: string, app: string): boolean {
    return (
      this.HsConfig.get(app).componentsEnabled == undefined ||
      this.HsConfig.get(app).componentsEnabled[which] == undefined ||
      this.HsConfig.get(app).componentsEnabled[which]
    );
  }

  /**
   * Sets new main panel (Panel displayed in expanded sidebar).
   * Change GUI and queryable status of map (when queryable and with hs.query component in app, map does info query on map click).
   * @public
   * @param which - New panel to activate (panel name)
   * @param app - Application's ID
   * @param by_gui - Whether function call came as result of GUI action
   */
  //TODO: introduce a new breaking change = change fction pattern to (which, {app, byGui}) => Promise<void>
  setMainPanel(
    which: string,
    app: string = 'default',
    by_gui?: boolean
  ): Promise<void> {
    const appRef = this.get(app);
    if (!this.panelEnabled(which, app)) {
      return;
    }
    if (which == appRef.mainpanel && by_gui) {
      which = '';
      if (appRef.sidebarExpanded == true) {
        if (appRef.sidebarPosition == 'bottom') {
          appRef.sidebarExpanded = false;
        } else {
          appRef.sidebarLabels = true;
        }
      }
    } else {
      appRef.sidebarExpanded = true;
      appRef.sidebarLabels = false;
    }
    appRef.mainpanel = which;
    const componentRefInstance = this.hsPanelContainerService
      .get(app)
      .panels.find((p) => p.name == which);
    this.hsPanelContainerService.setPanelWidth(
      this.HsConfig.get(app).panelWidths,
      componentRefInstance
    );
    for (const p of this.hsPanelContainerService.apps[app].panels) {
      const visible = p.isVisible();
      if (p.isVisible$ && p.isVisible$.value != visible) {
        p.isVisible$.next(visible);
      }
    }
    this.HsEventBusService.mainPanelChanges.next({which, app});
  }

  /**
   * Sets new default panel (Panel which is opened first and which displayed if previous active panel is closed)
   * @public
   * @param which - New panel to be default (specify panel name)
   */
  setDefaultPanel(which: string, app: string = 'default'): void {
    this.get(app).defaultPanel = which;
    this.setMainPanel(which, app);
  }

  getPanelSpaceWidth(app: string): number {
    const appRef = this.get(app);
    const panelSpaceWidth = appRef.layoutElement.getElementsByClassName(
      'hs-panelspace-wrapper'
    )[0].clientWidth;
    return panelSpaceWidth;
  }

  async updSidebarVisible(app: string, visible?: boolean): Promise<void> {
    if (
      this.HsConfig.get(app).sidebarPosition == 'invisible' ||
      this.HsConfig.get(app).pureMap ||
      this.HsConfig.get(app).componentsEnabled.guiOverlay === false ||
      this.HsConfig.get(app).componentsEnabled.sidebar === false
    ) {
      return this.sidebarVisible.next({app, visible: false});
    }
    if (visible == undefined) {
      this.sidebarVisible.next({app, visible: true});
    } else {
      this.sidebarVisible.next({app, visible});
    }
  }

  panelSpaceHeight(app: string) {
    const appRef = this.get(app);
    if (appRef.contentWrapper.querySelector('.hs-panelspace-wrapper')) {
      return appRef.contentWrapper.querySelector('.hs-panelspace-wrapper')
        .clientHeight;
      // return tmp
    }
  }

  mdToolbarHeight(app: string) {
    const ELEM = this.get(app).contentWrapper.querySelector('.md-app-toolbar');
    return ELEM ? ELEM.clientHeight : 0;
  }

  addMapVisualizer(visualizerComponent: Type<unknown>, _app: string): void {
    const componentFactory =
      this.componentFactoryResolver.resolveComponentFactory(
        visualizerComponent
      );

    this.mapSpaceRef.subscribe((params) => {
      if (params?.viewContainerRef && params?.app == _app) {
        const componentRef: any =
          params.viewContainerRef.createComponent(componentFactory);
        componentRef.instance.app = params?.app;
      }
    });
  }

  createPanel(panelComponent: Type<any>, app = 'default', data?: any): void {
    this.hsPanelContainerService.create(panelComponent, data || {}, app);
  }

  createOverlay(panelComponent: Type<any>, app?: string, data?: any): void {
    this.hsOverlayPanelContainerService.create(panelComponent, data || {}, app);
  }

  scrollTo(el: ElementRef) {
    el.nativeElement.scrollIntoView({behavior: 'smooth'});
  }
}
