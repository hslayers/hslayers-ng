import {BehaviorSubject} from 'rxjs';
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
  _sidebarVisible?: any;
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
  }> = new BehaviorSubject(null);

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

  init(app: string): void {
    setTimeout((_) => {
      this.parseConfig(app);
    }, 0);
  }

  parseConfig(app: string) {
    this.get(app).panel_enabled = {};
    for (const key of Object.keys(this.HsConfig.get(app).panelsEnabled)) {
      this.panelEnabled(key, app, this.getPanelEnableState(key, app));
    }

    this.get(app).sidebarToggleable = this.HsConfig.get(app).hasOwnProperty(
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
  panelVisible(which, app: string, scope?) {
    if (scope) {
      if (scope.panelName == undefined) {
        scope.panelName = which;
      }
    }
    if (this.get(app).panel_statuses[which] !== undefined) {
      return (
        this.get(app).panel_statuses[which] && this.panelEnabled(which, app)
      );
    }
    return this.get(app).mainpanel == which || (scope && scope.unpinned);
  }

  /**
   * Close opened panel programmatically.
   * If sidebar toolbar is used in app, sidebar stay expanded with sidebar labels.
   * Cannot resolve unpinned panels.
   * @public
   */
  hidePanels(app) {
    this.get(app).mainpanel = '';
    this.get(app).sidebarLabels = true;
    this.HsEventBusService.mainPanelChanges.next({app});
  }

  get(app?: string): HsLayoutParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = defaultLayoutParams;
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * @public
   * @param {object} which Panel to close (panel scope)
   * @description Close selected panel (either unpinned panels or actual mainpanel). If default panel is defined, it is opened instead.
   */
  closePanel(which, app: string) {
    if (which.unpinned) {
      this.get(app)
        .contentWrapper.querySelector(which.original_container)
        .appendChild(which.drag_panel);
      which.drag_panel.css({
        top: 'auto',
        left: 'auto',
        position: 'relative',
      });
    }
    which.unpinned = false;
    if (which.panelName == this.get(app).mainpanel) {
      if (this.get(app).defaultPanel != '') {
        if (which.panelName == this.get(app).defaultPanel) {
          this.get(app).sidebarExpanded = false;
        } else {
          this.setMainPanel(this.get(app).defaultPanel, app);
        }
      } else {
        this.get(app).mainpanel = '';
        this.get(app).sidebarLabels = true;
      }
      this.get(app).sidebarExpanded = false;
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
    if (status === undefined) {
      if (this.get(app).panel_enabled[which] != undefined) {
        return this.get(app).panel_enabled[which];
      } else {
        return true;
      }
    } else {
      this.get(app).panel_enabled[which] = status;
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
  setMainPanel(which: string, app: string, by_gui?: boolean): void {
    if (!this.panelEnabled(which, app)) {
      return;
    }
    if (which == this.get(app).mainpanel && by_gui) {
      which = '';
      if (this.get(app).sidebarExpanded == true) {
        if (this.sidebarBottom()) {
          this.get(app).sidebarExpanded = false;
        } else {
          this.get(app).sidebarLabels = true;
        }
      }
    } else {
      this.get(app).sidebarExpanded = true;
      this.get(app).sidebarLabels = false;
    }
    this.get(app).mainpanel = which;
    const componentRefInstance = this.hsPanelContainerService.panels.find(
      (p) => p.name == which
    );
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
  setDefaultPanel(which: string, app: string): void {
    this.get(app).defaultPanel = which;
    this.setMainPanel(which, app);
  }

  panelSpaceWidth(app: string) {
    const panelWidths = {
      default: 425,
      ows: 700,
      composition_browser: 550,
      addData: 700,
      mapSwipe: 550,
    };
    const layoutWidth = this.get(app).layoutElement.clientWidth;
    Object.assign(panelWidths, this.HsConfig.get(app).panelWidths);
    let tmp = panelWidths[this.get(app).mainpanel] || panelWidths.default;

    if (typeof tmp === 'string' && tmp.includes('%')) {
      const widthRatio = Number(tmp.replace('%', ''));
      return layoutWidth * (widthRatio / 100);
    }

    if (layoutWidth <= 767 && window.innerWidth <= 767) {
      tmp = layoutWidth;
      this.get(app).sidebarToggleable = false;

      return tmp;
    } else {
      this.get(app).sidebarToggleable =
        this.HsConfig.get(app).sidebarToggleable != undefined
          ? this.HsConfig.get(app).sidebarToggleable
          : true;
      if (!this.get(app).sidebarToggleable) {
        return tmp;
      }
    }
    if (this.get(app).sidebarExpanded && this.sidebarVisible(app)) {
      if (panelWidths[this.get(app).mainpanel]) {
        tmp = panelWidths[this.get(app).mainpanel];
      } else {
        tmp = panelWidths.default;
      }
    } else {
      if (this.sidebarVisible(app)) {
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

  sidebarVisible(app: string, state?: boolean): boolean {
    if (
      this.HsConfig.get(app).sidebarPosition == 'invisible' ||
      this.HsConfig.get(app).pureMap ||
      this.HsConfig.get(app).componentsEnabled.guiOverlay === false ||
      this.HsConfig.get(app).componentsEnabled.sidebar === false
    ) {
      return false;
    }
    if (state != undefined) {
      this.get(app)._sidebarVisible = state;
    }
    if (this.get(app)._sidebarVisible == undefined) {
      return true;
    } else {
      return this.get(app)._sidebarVisible;
    }
  }

  sidebarBottom() {
    return window.innerWidth <= 767;
  }

  panelSpaceHeight(app: string) {
    if (this.get(app).contentWrapper.querySelector('.hs-panelspace-wrapper')) {
      return this.get(app).contentWrapper.querySelector(
        '.hs-panelspace-wrapper'
      ).clientHeight;
      // return tmp
    }
  }

  mdToolbarHeight(app: string) {
    const ELEM = this.get(app).contentWrapper.querySelector('.md-app-toolbar');
    return ELEM ? ELEM.clientHeight : 0;
  }

  widthWithoutPanelSpace(app: string) {
    return 'calc(100% - ' + this.panelSpaceWidth(app) + 'px)';
  }

  mapStyle(app: string) {
    const fullscreen =
      this.HsConfig.get(app).sizeMode == undefined ||
      this.HsConfig.get(app).sizeMode == 'fullscreen';
    let height = this.get(app).layoutElement.clientHeight;
    let width = this.get(app).layoutElement.clientWidth;
    let marginLeft = 0;

    if (!this.sidebarBottom() || !fullscreen) {
      marginLeft += this.get(app).sidebarRight ? 0 : this.panelSpaceWidth(app);
      width -= this.panelSpaceWidth(app);
    }
    if (this.sidebarBottom() && (fullscreen || window.innerWidth <= 767)) {
      height -= this.panelSpaceHeight(app);
      width = this.panelSpaceWidth(app);
    }

    height -= this.mdToolbarHeight(app);

    this.HsEventBusService.layoutResizes.next({
      width,
      height,
    });

    return {
      height: `${height}px`,
      width: `${width}px`,
      ...(marginLeft > 0 && {marginLeft: `${marginLeft}px`}),
    };
  }

  addMapVisualizer(visualizerComponent: Type<unknown>, _app: string): void {
    const componentFactory =
      this.componentFactoryResolver.resolveComponentFactory(
        visualizerComponent
      );

    this.mapSpaceRef.subscribe(({viewContainerRef, app}) => {
      if (viewContainerRef && app == _app) {
        viewContainerRef.createComponent(componentFactory);
      }
    });
  }

  createPanel(panelComponent: Type<any>, data?: any): void {
    this.hsPanelContainerService.create(panelComponent, data || {});
  }

  createOverlay(panelComponent: Type<any>, data?: any): void {
    this.hsOverlayPanelContainerService.create(panelComponent, data || {});
  }
}
