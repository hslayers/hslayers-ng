/**
 * @param $rootScope
 * @param $controller
 * @param $injector
 * @param $window
 * @param HsMapService
 * @param HsConfig
 * @param $timeout
 * @param HsLayoutService
 * @param $log
 * @param $document
 * @param HsUtilsService
 */
export default function (
  $rootScope,
  $controller,
  $injector,
  $window,
  HsMapService,
  HsConfig,
  $timeout,
  HsLayoutService,
  $log,
  $document,
  HsUtilsService
) {
  'ngInject';
  const me = {
    hslayersNgTemplate: require('../../hslayers.html'),
    /**
     * @ngdoc property
     * @name HsCore#config
     * @public
     * @type {object}
     * @description Service shortcut to config module defined by app.js for application
     */
    config: HsConfig,
    /**
     * @ngdoc property
     * @name HsCore#scopes_registered
     * @public
     * @type {Array}
     * @description DEPRECATED?
     */
    embededEnabled: true,
    /**
     * @ngdoc property
     * @name HsCore#_exist_cache
     * @public
     * @type {object}
     * @description DEPRECATED?
     */
    _exist_cache: {},

    /**
     * @ngdoc property
     * @name HsCore#sizeOptions
     * @public
     * @type {object}
     * @description Hold data for computing app sizes. Shouldnt be modified directly. Holds reference to HS app element and optionally its container.
     */
    sizeOptions: {
      element: undefined,
      windowedMap: undefined,
      selector: undefined,
    },
    language: 'en',
    setMainPanel: function (which, by_gui) {
      $log.warn(
        'setMainPanel will be removed from HsCore in future. Use HsLayoutService#setMainPanel method instead'
      );
      HsLayoutService.setMainPanel(which, by_gui);
    },
    setDefaultPanel: function (which) {
      $log.warn(
        'setDefaultPanel will be removed from HsCore in future. Use HsLayoutService#setDefaultPanel method instead'
      );
      return HsLayoutService.setDefaultPanel(which);
    },
    panelVisible: function (which, scope) {
      $log.warn(
        'panelVisible will be removed from HsCore in future. Use HsLayoutService#panelVisible method instead'
      );
      return HsLayoutService.panelVisible(which, scope);
    },
    panelEnabled: function (which, status) {
      $log.warn(
        'panelEnabled will be removed from HsCore in future. Use HsLayoutService#panelEnabled method instead'
      );
      return HsLayoutService.panelEnabled(which, status);
    },
    closePanel: function (which) {
      $log.warn(
        'closePanel will be removed from HsCore in future. Use HsLayoutService#closePanel method instead'
      );
      return HsLayoutService.closePanel(which);
    },
    fullScreenMap: function (element) {
      $log.warn(
        'fullScreenMap will be removed from HsCore in future. Use HsLayoutService#fullScreenMap method instead'
      );
      return HsLayoutService.fullScreenMap(element, me);
    },
    get singleDatasources() {
      return HsConfig.allowAddExternalDatasets;
    },
    set singleDatasources(newName) {
      $log.warn(
        'singleDatasources will be removed from HsCore in future. Use config.allowAddExternalDatasets instead or hide datasource_selector panel using config.panelsEnabled object'
      );
      HsConfig.allowAddExternalDatasets = newName;
    },
    /**
     * @ngdoc method
     * @name HsCore#exists
     * @public
     * @param {string} name Controler or module name to test e.g. hs.print
     * @returns {boolean} True if controller or module exists
     * @description Test if selected panel controller or module is defined in application.
     */
    exists: function (name) {
      if (angular.isDefined(me._exist_cache[name])) {
        return true;
      }
      if (name in $injector.modules) {
        me._exist_cache[name] = true;
        return true;
      }
      try {
        $controller(name);
        me._exist_cache[name] = true;
        return true;
      } catch (error) {
        const t = !(error instanceof TypeError);
        if (t) {
          me._exist_cache[name] = true;
        }
        return t;
      }
    },
    /**
     * @ngdoc method
     * @name HsCore#init
     * @public
     * @param {object} element HS layers element gained from directive link
     * @param {object} options Optional options object when HS app has not CSS sizes declared. Parent property is Boolean type when size should be taken from HS element parent. Element property is string for any css like selector
     * @description Initialization function for HS layers elements and their sizes. Stores element and container references and sets event listeners for map resizing.
     */
    init: function (element, options) {
      if (me.initCalled) {
        return;
      }
      if (angular.isUndefined(options)) {
        options = {};
      }
      if (angular.isDefined(options.windowedMap)) {
        me.sizeOptions.windowedMap = options.windowedMap;
      }
      me.sizeOptions.element = element;
      if (
        angular.isDefined(options.innerElement) &&
        $document[0].getElementById(options.innerElement.replace('#', ''))
      ) {
        me.sizeOptions.innerElement = $document[0].getElementById(
          options.innerElement.replace('#', '')
        );
      }
      HsMapService.loaded().then((map) => {
        if (angular.isDefined(options.parent)) {
          me.sizeOptions.selector = element.parent();
          me.initSizeListeners();
          me.updateElementSize();
        } else if (angular.isDefined(options.element)) {
          me.sizeOptions.selector = options.element;
          me.initSizeListeners();
          me.updateElementSize();
        } else {
          me.initSizeListeners();
          me.updateMapSize();
        }

        me.initCalled = true;
      });
    },
    /**
     * @ngdoc method
     * @name HsCore#setSizeByContainer
     * @public
     * @description Change container for HS element.
     */
    setSizeByContainer: function () {
      //TODO Output warning if sizeOptions.element is not set
      me.sizeOptions.selector = me.sizeOptions.element.parent();
      me.updateElementSize();
    },
    /**
     * @ngdoc method
     * @name HsCore#setSizeByCSS
     * @public
     * @param {number} height New height of HS element in pixels
     * @param {number} width New width of HS element in pixels
     * @description Change HS element size programmatically (currently accept only integer value of pixels).
     */
    setSizeByCSS: function (height, width) {
      if (angular.isDefined(me.sizeOptions.selector)) {
        me.sizeOptions.selector = undefined;
      }
      const element = me.sizeOptions.element;
      element.style.height = height + 'px';
      element.style.width = width + 'px';
      me.updateMapSize();
    },
    /**
     * @ngdoc method
     * @name HsCore#initSizeListeners
     * @public
     * @description Add event listeners for updating HS element and map size after browser resizing or complete load of application.
     */
    initSizeListeners: function () {
      const w = $window;
      /**
       * @ngdoc method
       * @name HsCore#updateVH
       * @private
       * @description Define and change size of CSS custom variable --vh used as reference for hs.app-height
       */
      const updateVH = HsUtilsService.debounce(
        () => {
          if (me.sizeOptions.mode != 'fullscreen') {
            return;
          }
          const vh = w.innerHeight * 0.01;
          $document[0].documentElement.style.setProperty('--vh', `${vh}px`);

          if (w.matchMedia('(orientation: portrait)').matches) {
            document.getElementsByTagName('html')[0].style.height = '100vh';
            $timeout(() => {
              document.getElementsByTagName('html')[0].style.height = '100%';
            }, 500);
          }
        },
        150,
        false,
        me
      );

      w.addEventListener('resize', () => {
        updateVH();
        angular.isUndefined(me.sizeOptions.selector)
          ? me.updateMapSize()
          : me.updateElementSize();
      });

      angular.isUndefined(me.sizeOptions.selector)
        ? me.updateMapSize()
        : me.updateElementSize();
      w.addEventListener('load', () => {
        //onload checker for cases when bootstrap css change box-sizing property
        angular.isUndefined(me.sizeOptions.selector)
          ? me.updateMapSize()
          : me.updateElementSize();
      });
    },
    /**
     * @ngdoc method
     * @name HsCore#updateElementSize
     * @public
     * @description Update HS element size by its container sizes.
     */
    updateElementSize: function () {
      const element = me.sizeOptions.element[0];
      const container = me.sizeOptions.selector[0];
      element.style.height = container.clientHeight + 'px';
      element.style.width = container.offsetWidth + 'px';
      me.updateMapSize();
    },
    /**
     * @ngdoc method
     * @name HsCore#updateMapSize
     * @public
     * @description Update map size.
     */
    updateMapSize: function () {
      const container = angular.isDefined(me.sizeOptions.innerElement)
        ? me.sizeOptions.innerElement
        : me.sizeOptions.element[0];
      const map = HsLayoutService.contentWrapper.querySelector('.hs-ol-map');
      if (map === null) {
        return;
      }
      let sidebarElem = null;
      if (
        HsLayoutService.contentWrapper.getElementsByClassName('hs-panelspace')
          .length > 0
      ) {
        sidebarElem = HsLayoutService.contentWrapper.querySelector(
          '.hs-panelspace'
        );
      }
      const neededSize = {width: 0, height: container.clientHeight};

      if (me.puremapApp) {
        neededSize.width = container.offsetWidth;
      } else if (sidebarElem === null) {
        neededSize.width = container.offsetWidth;
      } else if (
        sidebarElem !== null &&
        container.offsetWidth > sidebarElem.offsetWidth
      ) {
        neededSize.width = container.offsetWidth - sidebarElem.offsetWidth;
      }
      // map.style.height = neededSize.height + 'px';
      // map.style.width = neededSize.width + 'px';
      if (angular.isDefined(HsMapService.map)) {
        HsMapService.map.updateSize();
        $timeout(() => {
          map.offsetWidth < 767
            ? (HsLayoutService.smallWidth = true)
            : (HsLayoutService.smallWidth = false);
        }, 0);
      }

      $rootScope.$broadcast('HsCore.mapSizeUpdated', neededSize);
    },

    /**
     * @ngdoc method
     * @name HsCore#searchVisible
     * @public
     * @param {booelan} is New status of search panel
     * @returns {boolean} Current status of Search panel
     * @description DEPRECATED?
     */
    searchVisible: function (is) {
      if (arguments.length > 0) {
        me.panel_statuses['search'] = is;
      }
      return me.panel_statuses['search'];
    },
    /**
     * @ngdoc method
     * @name HsCore#isAuthorized
     * @public
     * @returns {boolean} Check result - true for authorized user
     * @description Do authorization check of User, currently authorization is possible only in connection with Lifearray app
     */
    isAuthorized: function () {
      if (
        angular.isUndefined($window.getLRUser) &&
        angular.isUndefined(me.missingLRFunctionsWarned)
      ) {
        $log.warn(
          'window.getLRUser function needs to be defined, which usually comes from liferay.'
        );
        me.missingLRFunctionsWarned = true;
      }
      if (
        angular.isDefined($window.getLRUser) &&
        $window.getLRUser() != 'guest'
      ) {
        return true;
      }
      return true;
    },
    /**
     * @ngdoc method
     * @name HsCore#resetMap
     * @public
     * @description Do complete reset of map (view, layers) according to app config
     */
    resetMap: function () {
      HsMapService.reset();
      /**
       * @ngdoc event
       * @name HsCore#core.map_reset
       * @eventType broadcast on $rootScope
       * @description Fires when map completely reset
       */
      $rootScope.$broadcast('core.map_reset', {});
    },
    /**
     * @ngdoc method
     * @name HsCore#isMobile
     * @public
     * @returns {string} Returns "mobile" or ""
     * @description Test if screen of used device is mobile type (current breakdown is screen width 800px)
     */
    isMobile: function () {
      if ($window.cordova) {
        return 'mobile';
      } else {
        return '';
      }
    },
    createComponentsEnabledConfigIfNeeded() {
      if (angular.isUndefined(HsConfig.componentsEnabled)) {
        HsConfig.componentsEnabled = {};
      }
    },
  };

  let _puremapApp = false;
  /**
   * @ngdoc property
   * @name HsCore#puremapApp
   * @public
   * @type {boolean} false
   * @description If app is running in puremapApp mode
   */
  Object.defineProperty(me, 'puremapApp', {
    get: function () {
      return _puremapApp;
    },
    set: function (value) {
      _puremapApp = value;
      if (value) {
        me.createComponentsEnabledConfigIfNeeded();
        HsConfig.componentsEnabled.toolbar = false;
        HsConfig.componentsEnabled.sidebar = false;
        HsConfig.componentsEnabled.geolocationButton = false;
        HsConfig.mapInteractionsEnabled = false;
        HsConfig.componentsEnabled.mapControls = false;
        HsLayoutService.sidebarVisible(false);
      }
    },
  });

  if (me.exists('HsSidebarController') /*&& me.puremapApp != true*/) {
    if ($window.innerWidth < 767 || HsConfig.sidebarClosed) {
      HsLayoutService.sidebarExpanded = false;
      HsLayoutService.sidebarLabels = false;
    } else {
      HsLayoutService.sidebarExpanded = true;
    }
  }

  /* HACK: https://github.com/openlayers/ol3/issues/3990
            try {
                if (typeof require('proj4') != undefined) {
                    require(['proj4'], function () {
                        window.proj4 = proj4
                    });
                }
            } catch (ex) {
                require(['proj4'], function () {
                    window.proj4 = proj4
                });
            }
            */

  return me;
}
