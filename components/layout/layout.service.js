/**
 * @param HsConfig
 * @param $rootScope
 * @param $window
 * @param $document
 * @param $timeout
 * @param $log
 */
export default function (
  HsConfig,
  $rootScope,
  $window,
  $document,
  $timeout,
  $log
) {
  'ngInject';
  const me = this;

  me.data = {
    panels: [
      {
        enabled: true,
        order: 0,
        title: 'Map Compositions',
        description: 'List available map compositions',
        name: 'composition_browser',
        directive: 'hs.compositions',
        mdicon: 'map',
      },
      {
        enabled: true,
        order: 1,
        title: 'Manage and Style Layers',
        description: 'Manage and style your layers in composition',
        name: 'layermanager',
        directive: 'hs.layermanager',
        mdicon: 'layers',
      },
      {
        enabled: true,
        order: 2,
        title: 'Legend',
        description: 'Display map legend',
        name: 'legend',
        directive: 'hs.legend',
        mdicon: 'format_list_bulleted',
      },
      {
        enabled: () => {
          return me.panelEnabled('datasource_selector');
        },
        order: 3,
        title:
          angular.isUndefined(HsConfig.datasources) ||
          HsConfig.datasources.length > 0
            ? 'Datasource Selector'
            : 'Add layers',
        description: 'Select data or services for your map composition',
        name: 'datasource_selector',
        directive: 'hs.datasource-selector',
        mdicon: 'dns',
      },
      {
        enabled: true,
        order: 5,
        title: 'Measurements',
        description: 'Measure distance or area at map',
        name: 'measure',
        directive: 'hs.measure',
        mdicon: 'straighten',
      },
      {
        enabled: true,
        order: 6,
        title: 'Print',
        description: 'Print map',
        name: 'print',
        directive: 'hs.print',
        mdicon: 'print',
      },
      {
        enabled: true,
        order: 7,
        title: 'Share map',
        description: 'Share map',
        name: 'permalink',
        directive: 'hs.permalink',
        mdicon: 'share',
      },
      {
        enabled: true,
        order: 8,
        title: 'Save composition',
        description: 'Save content of map to composition',
        name: 'saveMap',
        directive: 'hs.save-map',
        mdicon: 'save',
      },
    ],
  };

  angular.extend(me, {
    /**
     * @ngdoc property
     * @name HsLayoutService#defaultPanel
     * @public
     * @type {string} null
     * @description Storage of default (main) panel (panel which is opened during initialization of app and also when other panel than default is closed).
     */
    defaultPanel: '',
    /**
     * @ngdoc property
     * @name HsLayoutService#panel_statuses
     * @public
     * @type {object}
     */
    panel_statuses: {},
    /**
     * @ngdoc property
     * @name HsLayoutService#panel_enabled
     * @public
     * @type {object}
     * @description DEPRACATED?
     */
    panel_enabled: {},
    /**
     * @ngdoc property
     * @name HsLayoutService#mainpanel
     * @public
     * @type {string} null
     * @description Storage of current main panel (panel which is opened). When {@link HsLayoutService#defaultPanel defaultPanel} is specified, main panel is set to it during HsCore initialization.
     */
    mainpanel: '',
    /**
     * @ngdoc property
     * @name HsCore#sidebarRight
     * @public
     * @type {boolean} true
     * @description Side on which sidebar will be shown (true - right side of map, false - left side of map)
     */
    sidebarRight: true,
    /**
     * @ngdoc property
     * @name HsLayoutService#sidebarLabels
     * @public
     * @type {boolean} true
     * @description DEPRECATED? (labels display is done with CSS classes)
     */
    sidebarLabels: true,
    /**
     * @ngdoc property
     * @name HsLayoutService#sidebarToggleable
     * @public
     * @type {boolean} true
     * @description Enable sidebar function to open/close sidebar (if false sidebar panel cannot be opened/closed through GUI)
     */
    sidebarToggleable: true,
    /**
     * @ngdoc property
     * @name HsLayoutService#sidebarButtons
     * @public
     * @type {boolean} true
     * @description DEPRECATED?
     */
    sidebarButtons: true,
    /**
     * @ngdoc property
     * @name HsLayoutService#smallWidth
     * @public
     * @type {boolean} false
     * @description Helper property for showing some button on smaller screens
     */
    smallWidth: false,

    /**
     * @ngdoc method
     * @name HsLayoutService#fullScreenMap
     * @public
     * @param {object} element HS layers element gained from directive link
     * @param {object} core hs.HsCore element, holds sizeOptions variable and init method
     * @description Helper function for single page HS map applications.
     */
    fullScreenMap: function (element, core) {
      $document[0].documentElement.style.overflow = 'hidden';
      $document[0].documentElement.style.height = '100%';
      $document[0].body.style.height = '100%';
      core.sizeOptions.mode = 'fullscreen';
      core.init(element, {parent: true});
    },
    /**
     * @ngdoc method
     * @name HsLayoutService#panelVisible
     * @public
     * @param {string} which Name of panel to test
     * @param {$scope} scope Angular scope of panels controller (optional, needed for test of unpinned panels)
     * @returns {boolean} Panel opened/closed status
     * @description Find if selected panel is currently opened (in sidebar or as unpinned window)
     */
    panelVisible(which, scope) {
      if (angular.isDefined(scope)) {
        if (angular.isUndefined(scope.panelName)) {
          scope.panelName = which;
        }
      }
      if (angular.isDefined(me.panel_statuses[which])) {
        return me.panel_statuses[which] && me.panelEnabled(which);
      }
      return (
        me.mainpanel == which || (angular.isDefined(scope) && scope.unpinned)
      );
    },
    /**
     * @ngdoc method
     * @name HsLayoutService#hidePanels
     * @public
     * @description Close opened panel programmaticaly. If sidebar toolbar is used in app, sidebar stay expanded with sidebar labels. Cannot resolve unpinned panels.
     */
    hidePanels: function () {
      me.mainpanel = '';
      me.sidebarLabels = true;
      $timeout(() => {
        if (!me.exists('HsSidebarController')) {
          me.sidebarExpanded = false;
        }
        $rootScope.$broadcast('core.mainpanel_changed');
      }, 0);
    },
    /**
     * @ngdoc method
     * @name HsLayoutService#closePanel
     * @public
     * @param {object} which Panel to close (panel scope)
     * @description Close selected panel (either unpinned panels or actual mainpanel). If default panel is defined, it is opened instead.
     */
    closePanel: function (which) {
      if (which.unpinned) {
        me.contentWrapper
          .querySelector(which.original_container)
          .appendChild(which.drag_panel);
        which.drag_panel.css({
          top: 'auto',
          left: 'auto',
          position: 'relative',
        });
      }
      which.unpinned = false;
      if (which.panelName == me.mainpanel) {
        if (me.defaultPanel != '') {
          if (which.panelName == me.defaultPanel) {
            me.sidebarExpanded = false;
          } else {
            me.setMainPanel(me.defaultPanel);
          }
        } else {
          me.mainpanel = '';
          me.sidebarLabels = true;
        }
        me.sidebarExpanded = false;
      }

      $rootScope.$broadcast('core.mainpanel_changed', which);
    },
    /**
     * @ngdoc method
     * @name HsLayoutService#panelEnabled
     * @public
     * @param {string} which Selected panel (panel name)
     * @param {boolean} status Visibility status of panel to set
     * @returns {boolean} Panel enabled/disabled status for getter function
     * @description Get or set panel visibility in sidebar. When panel is disabled it means that it's not displayed in sidebar (it can be opened programmaticaly) but it's functionality is running. Use with status parameter as setter.
     */
    panelEnabled: function (which, status) {
      if (angular.isUndefined(status)) {
        if (angular.isDefined(me.panel_enabled[which])) {
          return me.panel_enabled[which];
        } else {
          return true;
        }
      } else {
        me.panel_enabled[which] = status;
      }
    },

    componentEnabled(which) {
      return (
        angular.isUndefined(HsConfig.componentsEnabled) ||
        angular.isUndefined(HsConfig.componentsEnabled[which]) ||
        HsConfig.componentsEnabled[which]
      );
    },

    /**
     * @ngdoc method
     * @name HsLayoutService#setMainPanel
     * @public
     * @param {string} which New panel to activate (panel name)
     * @param {boolean} by_gui Whether function call came as result of GUI action
     * @description Sets new main panel (Panel displayed in expanded sidebar). Change GUI and queryable status of map (when queryable and with hs.query component in app, map does info query on map click).
     */
    setMainPanel: function (which, by_gui) {
      if (!me.panelEnabled(which)) {
        return;
      }
      if (which == me.mainpanel && by_gui) {
        which = '';
        if (me.sidebarExpanded == true) {
          if (me.sidebarBottom()) {
            me.sidebarExpanded = false;
          } else {
            me.sidebarLabels = true;
          }
        }
      } else {
        me.sidebarExpanded = true;
        me.sidebarLabels = false;
      }
      me.mainpanel = which;
      /**
       * @ngdoc event
       * @name HsCore#core.mainpanel_changed
       * @eventType broadcast on $rootScope
       * @description Fires when current mainpanel change - toggle, change of opened panel
       */
      $rootScope.$broadcast('core.mainpanel_changed');
    },
    /**
     * @ngdoc method
     * @name HsLayoutService#setDefaultPanel
     * @public
     * @param {string} which New panel to be default (specify panel name)
     * @description Sets new default panel (Panel which is opened first and which displayed if previous active panel is closed)
     */
    setDefaultPanel: function (which) {
      me.defaultPanel = which;
      me.setMainPanel(which);
    },
    panelSpaceWidth() {
      const panelWidths = {
        default: 400,
        datasource_selector: 700,
        ows: 700,
        composition_browser: 500,
      };
      const layoutWidth = me.layoutElement.clientWidth;
      Object.assign(panelWidths, HsConfig.panelWidths);
      let tmp = panelWidths[me.mainpanel] || panelWidths.default;

      if (typeof tmp === 'string' && tmp.includes('%')) {
        const widthRatio = Number(tmp.replace('%', ''));
        return layoutWidth * (widthRatio / 100);
      }

      if (layoutWidth <= 767 && $window.innerWidth <= 767) {
        tmp = layoutWidth;
        me.sidebarToggleable = false;

        return tmp;
      } else {
        me.sidebarToggleable = angular.isDefined(HsConfig.sidebarToggleable)
          ? HsConfig.sidebarToggleable
          : true;
        if (!me.sidebarToggleable) {
          return tmp;
        }
      }
      if (me.sidebarExpanded && me.sidebarVisible()) {
        if (panelWidths[me.mainpanel]) {
          tmp = panelWidths[me.mainpanel];
        } else {
          tmp = panelWidths.default;
        }
      } else {
        if (me.sidebarVisible()) {
          tmp = 48;
        } else {
          tmp = 0;
        }
      }
      if (tmp > layoutWidth * 0.45) {
        tmp = layoutWidth * 0.45;
      }
      return tmp;
    },

    sidebarVisible(state) {
      if (!me.componentEnabled('sidebar')) {
        return false;
      }
      if (angular.isDefined(state)) {
        me._sidebarVisible = state;
      }
      if (angular.isUndefined(me._sidebarVisible)) {
        return true;
      }
      return me._sidebarVisible;
    },
    sidebarBottom() {
      return !!me.layoutElement && me.layoutElement.clientWidth <= 767;
    },
    panelSpaceHeight() {
      if (me.contentWrapper.querySelector('.hs-panelspace-wrapper')) {
        return me.contentWrapper.querySelector('.hs-panelspace-wrapper')
          .clientHeight;
        // return tmp
      }
    },
    mdToolbarHeight() {
      const ELEM = me.contentWrapper.querySelector('.md-app-toolbar');
      return ELEM ? ELEM.clientHeight : 0;
    },
    /**
     * @ngdoc property
     * @name HsLayoutService#sidebarExpanded
     * @public
     * @type {boolean} false
     * @description Show if any sidebar panel is opened (sidebar is completely expanded). When hs.sidebar module is used in app, it change automatically to true during initialization.
     */
    sidebarExpanded: false,
    /**
     * @ngdoc property
     * @name HsLayoutService#minisidebar
     * @public
     * @type {boolean} false
     * @description Show if minisidebar panel is visible in sidebar, allows sidebar to be visible in panelspace
     */
    minisidebar: false,
    widthWithoutPanelSpace() {
      return 'calc(100% - ' + me.panelSpaceWidth() + 'px)';
    },
  });

  Object.defineProperty(me, 'panelListElement', {
    get: function () {
      return me.contentWrapper.querySelector('.hs-panelplace');
    },
  });

  Object.defineProperty(me, 'dialogAreaElement', {
    get: function () {
      return me.contentWrapper.querySelector('.hs-dialog-area');
    },
  });

  Object.defineProperty(me, 'sidebarListElement', {
    get: function () {
      return me.contentWrapper.querySelector('.hs-sidebar-list');
    },
  });

  const panelsEnabledDefaults = {
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
    routing: true,
    tracking: true,
    filter: false,
    search: false,
  };

  angular.forEach(panelsEnabledDefaults, (value, key) => {
    if (
      angular.isUndefined(HsConfig.panelsEnabled) ||
      angular.isUndefined(HsConfig.panelsEnabled[key])
    ) {
      me.panelEnabled(key, value);
    }
  });
  angular.forEach(HsConfig.panelsEnabled, (value, key) => {
    me.panelEnabled(key, value);
  });
  // For backwards-compatibility
  if (angular.isDefined(HsConfig.locationButtonVisible)) {
    $log.warn(
      'config.locationButtonVisible parameter is deprecated. Use config.panelsEnabled.geolocationButton instead'
    );
    if (angular.isUndefined(HsConfig.componentsEnabled)) {
      HsConfig.componentsEnabled = {};
    }
    if (angular.isUndefined(HsConfig.componentsEnabled.geolocationButton)) {
      HsConfig.componentsEnabled.geolocationButton =
        HsConfig.locationButtonVisible;
    }
  }

  return me;
}
