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

@Injectable({
  providedIn: 'root',
})
export class HsLayoutService {
  /**
   * Storage of default main panel.
   * This panel is opened during initialization of app and also when other panel than default is closed.
   * @public
   * @default ''
   */
  defaultPanel = '';
  /**
   * @public
   */
  panel_statuses = {};
  /**
   * @public
   * @description DEPRECATED?
   */
  panel_enabled = {};
  /**
   * Storage of current main panel (panel which is opened).
   * When {@link HsLayoutService#defaultPanel defaultPanel} is specified, main panel is set to it during HsCore initialization.
   * @public
   * @default ''
   */
  mainpanel = '';
  /**
   * Side on which sidebar will be shown (true = right side of map, false = left side of map)
   * @public
   * @default true
   */
  sidebarRight = true;
  /**
   * Whether to display labels of sidebar buttons or not.
   * Used in CSS classes assertion on hs-panelspace.
   * @public
   * @default true
   */
  sidebarLabels = true;
  /**
   * Enable sidebar function to open/close sidebar (if false sidebar panel cannot be opened/closed through GUI)
   * @public
   * @default true
   */
  sidebarToggleable = true;
  /**
   * DEPRECATED Always true
   * @public
   * @deprecated
   * @default true
   */
  sidebarButtons = true;
  /**
   * DEPRECATED Helper property for showing some button on smaller screens
   * @public
   * @deprecated
   * @default false
   */
  smallWidth = false;
  /**
   * Show if any sidebar panel is opened (sidebar is completely expanded).
   * When hs.sidebar module is used in app, it change automatically to true during initialization.
   * @public
   * @default false
   */
  sidebarExpanded = false;
  /**
   * Show if minisidebar panel is visible in sidebar, allows sidebar to be visible in panelspace
   * @public
   * @default false
   */
  initializedOnce = false;
  /**
   * Whether the app has been initialized already once. 
   * Need this to not add panels wtice when NgRouter is used
   * @public
   * @default false
   */
  minisidebar = false;
  contentWrapper: any;
  layoutElement: any;
  private _sidebarVisible: any;
  panelsEnabledDefaults = {
    legend: true,
    info: true,
    composition_browser: true,
    toolbar: true,
    measure: true,
    mobile_settings: false,
    draw: true,
    layermanager: true,
    print: true,
    saveMap: true,
    language: true,
    permalink: true,
    compositionLoadingProgress: false,
    sensors: true,
    tracking: true,
    filter: false,
    search: false,
    tripPlanner: false,
    addData: true,
    mapSwipe: false,
  };
  mapSpaceRef: BehaviorSubject<ViewContainerRef> = new BehaviorSubject(null);

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

    /* Timeout is needed because HsConfig can 
    be set after this service constructor is executed */
    setTimeout((_) => {
      this.parseConfig();
    }, 0);
  }

  parseConfig() {
    this.panel_enabled = {};
    for (const key of Object.keys(this.panelsEnabledDefaults)) {
      this.panelEnabled(key, this.getPanelEnableState(key));
    }
  }

  getPanelEnableState(panel): boolean {
    if (
      this.panelsEnabledDefaults[panel] == undefined &&
      (this.HsConfig?.panelsEnabled == undefined ||
        this.HsConfig?.panelsEnabled[panel] == undefined)
    ) {
      /* 
      Function called from sidebar and panel is 
      probably custom panel added to buttons array from outside 
      */
      return true;
    }
    if (this.HsConfig.panelsEnabled == undefined) {
      return this.panelsEnabledDefaults[panel];
    }
    if (this.HsConfig.panelsEnabled[panel] == undefined) {
      return this.panelsEnabledDefaults[panel];
    } else {
      return this.HsConfig.panelsEnabled[panel];
    }
  }

  /**
   * @public
   * @param {string} which Name of panel to test
   * @param {$scope} scope Angular scope of panels controller (optional, needed for test of unpinned panels)
   * @returns {boolean} Panel opened/closed status
   * @description Find if selected panel is currently opened (in sidebar or as unpinned window)
   */
  panelVisible(which, scope?) {
    if (scope) {
      if (scope.panelName == undefined) {
        scope.panelName = which;
      }
    }
    if (this.panel_statuses[which] !== undefined) {
      return this.panel_statuses[which] && this.panelEnabled(which);
    }
    return this.mainpanel == which || (scope && scope.unpinned);
  }

  /**
   * Close opened panel programmatically.
   * If sidebar toolbar is used in app, sidebar stay expanded with sidebar labels.
   * Cannot resolve unpinned panels.
   * @public
   */
  hidePanels() {
    this.mainpanel = '';
    this.sidebarLabels = true;
    this.HsEventBusService.mainPanelChanges.next();
  }

  /**
   * @public
   * @param {object} which Panel to close (panel scope)
   * @description Close selected panel (either unpinned panels or actual mainpanel). If default panel is defined, it is opened instead.
   */
  closePanel(which) {
    if (which.unpinned) {
      this.contentWrapper
        .querySelector(which.original_container)
        .appendChild(which.drag_panel);
      which.drag_panel.css({
        top: 'auto',
        left: 'auto',
        position: 'relative',
      });
    }
    which.unpinned = false;
    if (which.panelName == this.mainpanel) {
      if (this.defaultPanel != '') {
        if (which.panelName == this.defaultPanel) {
          this.sidebarExpanded = false;
        } else {
          this.setMainPanel(this.defaultPanel);
        }
      } else {
        this.mainpanel = '';
        this.sidebarLabels = true;
      }
      this.sidebarExpanded = false;
    }

    this.HsEventBusService.mainPanelChanges.next(which);
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
  panelEnabled(which: string, status?: boolean): boolean {
    if (status === undefined) {
      if (this.panel_enabled[which] != undefined) {
        return this.panel_enabled[which];
      } else {
        return true;
      }
    } else {
      this.panel_enabled[which] = status;
    }
  }

  /**
   * Wrapper for accessing HsConfig.componentsEnabled settings.
   * @param which - Name of the GUI component to check
   * @returns true if set to true (default), false otherwise
   */
  componentEnabled(which: string): boolean {
    return (
      this.HsConfig.componentsEnabled == undefined ||
      this.HsConfig.componentsEnabled[which] == undefined ||
      this.HsConfig.componentsEnabled[which]
    );
  }

  /**
   * Sets new main panel (Panel displayed in expanded sidebar).
   * Change GUI and queryable status of map (when queryable and with hs.query component in app, map does info query on map click).
   * @public
   * @param which - New panel to activate (panel name)
   * @param by_gui - Whether function call came as result of GUI action
   */
  setMainPanel(which: string, by_gui?: boolean): void {
    if (!this.panelEnabled(which)) {
      return;
    }
    if (which == this.mainpanel && by_gui) {
      which = '';
      if (this.sidebarExpanded == true) {
        if (this.sidebarBottom()) {
          this.sidebarExpanded = false;
        } else {
          this.sidebarLabels = true;
        }
      }
    } else {
      this.sidebarExpanded = true;
      this.sidebarLabels = false;
    }
    this.mainpanel = which;
    this.HsEventBusService.mainPanelChanges.next(which);
  }

  /**
   * Sets new default panel (Panel which is opened first and which displayed if previous active panel is closed)
   * @public
   * @param which - New panel to be default (specify panel name)
   */
  setDefaultPanel(which: string): void {
    this.defaultPanel = which;
    this.setMainPanel(which);
  }

  panelSpaceWidth() {
    const panelWidths = {
      default: 425,
      ows: 700,
      composition_browser: 550,
      addData: 700,
      mapSwipe: 550
    };
    const layoutWidth = this.layoutElement.clientWidth;
    Object.assign(panelWidths, this.HsConfig.panelWidths);
    let tmp = panelWidths[this.mainpanel] || panelWidths.default;

    if (typeof tmp === 'string' && tmp.includes('%')) {
      const widthRatio = Number(tmp.replace('%', ''));
      return layoutWidth * (widthRatio / 100);
    }

    if (layoutWidth <= 767 && window.innerWidth <= 767) {
      tmp = layoutWidth;
      this.sidebarToggleable = false;

      return tmp;
    } else {
      this.sidebarToggleable =
        this.HsConfig.sidebarToggleable != undefined
          ? this.HsConfig.sidebarToggleable
          : true;
      if (!this.sidebarToggleable) {
        return tmp;
      }
    }
    if (this.sidebarExpanded && this.sidebarVisible()) {
      if (panelWidths[this.mainpanel]) {
        tmp = panelWidths[this.mainpanel];
      } else {
        tmp = panelWidths.default;
      }
    } else {
      if (this.sidebarVisible()) {
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

  sidebarVisible(state?: boolean): boolean {
    if (
      this.HsConfig.sidebarPosition == 'invisible' ||
      this.HsConfig.pureMap ||
      this.HsConfig.componentsEnabled.guiOverlay === false ||
      this.HsConfig.componentsEnabled.sidebar === false
    ) {
      return false;
    }
    if (state != undefined) {
      this._sidebarVisible = state;
    }
    if (this._sidebarVisible == undefined) {
      return true;
    } else {
      return this._sidebarVisible;
    }
  }

  sidebarBottom() {
    return window.innerWidth <= 767;
  }

  panelSpaceHeight() {
    if (this.contentWrapper.querySelector('.hs-panelspace-wrapper')) {
      return this.contentWrapper.querySelector('.hs-panelspace-wrapper')
        .clientHeight;
      // return tmp
    }
  }

  mdToolbarHeight() {
    const ELEM = this.contentWrapper.querySelector('.md-app-toolbar');
    return ELEM ? ELEM.clientHeight : 0;
  }

  widthWithoutPanelSpace() {
    return 'calc(100% - ' + this.panelSpaceWidth() + 'px)';
  }

  mapStyle() {
    const fullscreen =
      this.HsConfig.sizeMode == undefined ||
      this.HsConfig.sizeMode == 'fullscreen';
    let height = this.layoutElement.clientHeight;
    let width = this.layoutElement.clientWidth;
    let marginLeft = 0;

    if (!this.sidebarBottom() || !fullscreen) {
      marginLeft += this.sidebarRight ? 0 : this.panelSpaceWidth();
      width -= this.panelSpaceWidth();
    }
    if (this.sidebarBottom() && (fullscreen || window.innerWidth <= 767)) {
      height -= this.panelSpaceHeight();
      width = this.panelSpaceWidth();
    }

    height -= this.mdToolbarHeight();

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

  addMapVisualizer(visualizerComponent: Type<unknown>): void {
    const componentFactory =
      this.componentFactoryResolver.resolveComponentFactory(
        visualizerComponent
      );

    this.mapSpaceRef.subscribe((mapSpace) => {
      if (mapSpace) {
        mapSpace.createComponent(componentFactory);
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
