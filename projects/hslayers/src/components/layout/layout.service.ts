import {BehaviorSubject, lastValueFrom} from 'rxjs';
import {
  ComponentFactoryResolver,
  Injectable,
  Type,
  ViewContainerRef,
} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLogService} from '../../common/log/log.service';
import {HsOverlayPanelContainerService} from './overlay-panel-container.service';
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

type HsLayoutParams = {
  /**
   * Storage of default main panel.
   * This panel is opened during initialization of app and also when other panel than default is closed.
   * @public
   * @default ''
   */
  defaultPanel: string;
  /**
   * @public
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
    setTimeout((_) => {
      this.parseConfig(_app);
    }, 0);
    this.HsEventBusService.mainPanelChanges.subscribe(({which, app}) => {
      this.updPanelSpaceWidth(app);
    });
    this.updPanelSpaceWidth(_app);
    this.updSidebarPosition(_app);
    this.updSidebarVisible(_app, true);
    this.sidebarVisible.subscribe(({app, visible}) => {
      this.apps[app].sidebarVisible = visible;
    });
    this.sidebarPosition.subscribe(({app, position}) => {
      this.apps[app].sidebarPosition = position;
    });
  }

  updPanelSpaceWidth(app: string) {
    this.panelSpaceWidth.next({app, width: this.getPanelSpaceWidth(app)});
  }

  async updSidebarPosition(app: string) {
    const lastPosition = this.sidebarPosition.value;
    if (window.innerWidth <= 767 && lastPosition.position != 'bottom') {
      this.sidebarPosition.next({
        app,
        position: 'bottom',
      });
    } else {
      if (this.HsConfig.apps[app].sidebarPosition != lastPosition.position) {
        this.sidebarPosition.next({
          app,
          position: this.HsConfig.apps[app].sidebarPosition,
        });
      }
    }
  }

  parseConfig(app: string) {
    const appRef = this.get(app);
    appRef.panel_enabled = {};
    for (const key of Object.keys(this.HsConfig.get(app).panelsEnabled)) {
      this.panelEnabled(key, app, this.getPanelEnableState(key, app));
    }

    appRef.sidebarToggleable = this.HsConfig.get(app).hasOwnProperty(
      'sidebarToggleable'
    )
      ? this.HsConfig.get(app).sidebarToggleable
      : true;
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
   * @public
   * @param {string} which Name of panel to test
   * @param {$scope} scope Angular scope of panels controller (optional, needed for test of unpinned panels)
   * @returns {boolean} Panel opened/closed status
   * @description Find if selected panel is currently opened (in sidebar or as unpinned window)
   */
  panelVisible(which, app: string = 'default', scope?) {
    const appRef = this.get(app);
    if (scope) {
      if (scope.panelName == undefined) {
        scope.panelName = which;
      }
    }
    if (appRef.panel_statuses[which] !== undefined) {
      return appRef.panel_statuses[which] && this.panelEnabled(which, app);
    }
    return appRef.mainpanel == which || (scope && scope.unpinned);
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
   * @param by_gui - Whether function call came as result of GUI action
   */
  setMainPanel(which: string, app: string, by_gui?: boolean): Promise<void> {
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
    const panelWidths = {
      default: 425,
      ows: 700,
      composition_browser: 550,
      addData: 700,
      mapSwipe: 550,
    };
    const layoutWidth = appRef.layoutElement.clientWidth;
    Object.assign(panelWidths, this.HsConfig.get(app).panelWidths);
    let tmp = panelWidths[appRef.mainpanel] || panelWidths.default;

    if (typeof tmp === 'string' && tmp.includes('%')) {
      const widthRatio = Number(tmp.replace('%', ''));
      return layoutWidth * (widthRatio / 100);
    }

    if (layoutWidth <= 767 && window.innerWidth <= 767) {
      tmp = layoutWidth;
      appRef.sidebarToggleable = false;
      return tmp;
    } else {
      appRef.sidebarToggleable =
        this.HsConfig.get(app).sidebarToggleable != undefined
          ? this.HsConfig.get(app).sidebarToggleable
          : true;
      if (!appRef.sidebarToggleable) {
        return tmp;
      }
    }
    if (appRef.sidebarExpanded && appRef.sidebarVisible) {
      if (panelWidths[appRef.mainpanel]) {
        tmp = panelWidths[appRef.mainpanel] + 48;
      } else {
        tmp = panelWidths.default + 48;
      }
    } else {
      if (appRef.sidebarVisible) {
        tmp = 48;
      } else {
        tmp = 0;
      }
    }
    // if (tmp > layoutWidth * 0.45) {
    //   tmp = layoutWidth * 0.45;
    // }
    return tmp;
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

  createPanel(panelComponent: Type<any>, app?: string, data?: any): void {
    this.hsPanelContainerService.create(panelComponent, data || {}, app);
  }

  createOverlay(panelComponent: Type<any>, app?: string, data?: any): void {
    this.hsOverlayPanelContainerService.create(panelComponent, data || {}, app);
  }
}
