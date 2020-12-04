import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLogService} from '../../common/log/log.service';
import {Injectable} from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class HsLayoutService {
  /**
   * @name HsLayoutService#defaultPanel
   * @public
   * @type {string} null
   * @description Storage of default (main) panel (panel which is opened during initialization of app and also when other panel than default is closed).
   */
  defaultPanel = '';
  /**
   * @name HsLayoutService#panel_statuses
   * @public
   * @type {object}
   */
  panel_statuses = {};
  /**
   * @name HsLayoutService#panel_enabled
   * @public
   * @type {object}
   * @description DEPRACATED?
   */
  panel_enabled = {};
  /**
   * @name HsLayoutService#mainpanel
   * @public
   * @type {string}
   * @default ''
   * @description Storage of current main panel (panel which is opened). When {@link HsLayoutService#defaultPanel defaultPanel} is specified, main panel is set to it during HsCore initialization.
   */
  mainpanel = '';
  /**
   * @name HsCore#sidebarRight
   * @public
   * @type {boolean}
   * @default true
   * @description Side on which sidebar will be shown (true - right side of map, false - left side of map)
   */
  sidebarRight = true;
  /**
   * @name HsLayoutService#sidebarLabels
   * @public
   * @type {boolean}
   * @default true
   * @description Whether to display labels of sidebar buttons or not.
   * Used in CSS classes assertion on hs-panelspace.
   */
  sidebarLabels = true;
  /**
   * @name HsLayoutService#sidebarToggleable
   * @public
   * @type {boolean}
   * @default true
   * @description Enable sidebar function to open/close sidebar (if false sidebar panel cannot be opened/closed through GUI)
   */
  sidebarToggleable = true;
  /**
   * @name HsLayoutService#sidebarButtons
   * @public
   * @type {boolean}
   * @default true
   * @description DEPRECATED?
   */
  sidebarButtons = true;
  /**
   * @name HsLayoutService#smallWidth
   * @public
   * @type {boolean}
   * @default false
   * @description Helper property for showing some button on smaller screens
   */
  smallWidth = false;
  /**
   * @name HsLayoutService#sidebarExpanded
   * @public
   * @type {boolean}
   * @default false
   * @description Show if any sidebar panel is opened (sidebar is completely expanded). When hs.sidebar module is used in app, it change automatically to true during initialization.
   */
  sidebarExpanded = false;
  /**
   * @name HsLayoutService#minisidebar
   * @public
   * @type {boolean}
   * @default false
   * @description Show if minisidebar panel is visible in sidebar, allows sidebar to be visible in panelspace
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
    mobile_settings: false,
    draw: false,
    datasource_selector: true,
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
  };

  constructor(
    public HsConfig: HsConfig,
    public HsEventBusService: HsEventBusService,
    public $log: HsLogService
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

    /* Timeout is needed because Hsconfig can 
    be set after this service constructor is executed */
    setTimeout((_) => {
      this.parseConfig();
    });
  }

  parseConfig() {
    for (const key of Object.keys(this.panelsEnabledDefaults)) {
      this.panelEnabled(key, this.getPanelEnableState(key));
    }
    this.createComponentsEnabledConfigIfNeeded();
    // For backwards-compatibility
    if (this.HsConfig.locationButtonVisible) {
      this.$log.warn(
        'config.locationButtonVisible parameter is deprecated. Use config.componentsEnabled.geolocationButton instead'
      );
      if (this.HsConfig.componentsEnabled.geolocationButton == undefined) {
        this.HsConfig.componentsEnabled.geolocationButton = this.HsConfig.locationButtonVisible;
      }
    }
    if (this.HsConfig.componentsEnabled?.basemapGallery == undefined) {
      this.HsConfig.componentsEnabled.basemapGallery = false;
    }
  }

  getPanelEnableState(panel): boolean {
    if (
      this.panelsEnabledDefaults[panel] == undefined &&
      this.HsConfig?.panelsEnabled[panel] == undefined
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
   * @ngdoc method
   * @name HsLayoutService#createComponentsEnabledConfigIfNeeded
   * @public
   * @description Creates componentsEnabled config if Needed
   */
  createComponentsEnabledConfigIfNeeded() {
    if (this.HsConfig.componentsEnabled === undefined) {
      this.HsConfig.componentsEnabled = {};
    }
  }
  /**
   * @ngdoc method
   * @name HsLayoutService#panelVisible
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
   * @ngdoc method
   * @name HsLayoutService#hidePanels
   * @public
   * @description Close opened panel programmaticaly. If sidebar toolbar is used in app, sidebar stay expanded with sidebar labels. Cannot resolve unpinned panels.
   */
  hidePanels() {
    this.mainpanel = '';
    this.sidebarLabels = true;
    this.HsEventBusService.mainPanelChanges.next();
  }

  /**
   * @ngdoc method
   * @name HsLayoutService#closePanel
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
   * @ngdoc method
   * @name HsLayoutService#panelEnabled
   * @public
   * @param {string} which Selected panel (panel name)
   * @param {boolean} status Visibility status of panel to set
   * @returns {boolean} Panel enabled/disabled status for getter function
   * @description Get or set panel visibility in sidebar. When panel is disabled it means that it's not displayed in sidebar (it can be opened programmaticaly) but it's functionality is running. Use with status parameter as setter.
   */
  panelEnabled(which: string, status?: boolean) {
    if (status == undefined) {
      if (this.panel_enabled[which] != undefined) {
        return this.panel_enabled[which];
      } else {
        return true;
      }
    } else {
      this.panel_enabled[which] = status;
    }
  }

  componentEnabled(which) {
    return (
      this.HsConfig.componentsEnabled == undefined ||
      this.HsConfig.componentsEnabled[which] == undefined ||
      this.HsConfig.componentsEnabled[which]
    );
  }

  /**
   * @ngdoc method
   * @name HsLayoutService#setMainPanel
   * @public
   * @param {string} which New panel to activate (panel name)
   * @param {boolean} by_gui Whether function call came as result of GUI action
   * @description Sets new main panel (Panel displayed in expanded sidebar). Change GUI and queryable status of map (when queryable and with hs.query component in app, map does info query on map click).
   */
  setMainPanel(which, by_gui?: boolean) {
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
    /**
     * @ngdoc event
     * @name HsEventBusService#mainPanelChanges
     * @eventType broadcast on HsEventBusService
     * @description Fires when current mainpanel change - toggle, change of opened panel
     */
    this.HsEventBusService.mainPanelChanges.next(which);
  }

  /**
   * @ngdoc method
   * @name HsLayoutService#setDefaultPanel
   * @public
   * @param {string} which New panel to be default (specify panel name)
   * @description Sets new default panel (Panel which is opened first and which displayed if previous active panel is closed)
   */
  setDefaultPanel(which) {
    this.defaultPanel = which;
    this.setMainPanel(which);
  }

  panelSpaceWidth() {
    const panelWidths = {
      default: 400,
      datasource_selector: 700,
      ows: 700,
      composition_browser: 500,
    };
    const layoutWidth = this.layoutElement.clientWidth;
    Object.assign(panelWidths, this.HsConfig.panelWidths);
    let tmp = panelWidths[this.mainpanel] || panelWidths.default;

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

  sidebarVisible(state?) {
    if (this.HsConfig.sidebarPosition == 'invisible') {
      return false;
    }
    if (state != undefined) {
      this._sidebarVisible = state;
    }
    if (this._sidebarVisible == undefined) {
      return true;
    }
    return this._sidebarVisible;
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
}
