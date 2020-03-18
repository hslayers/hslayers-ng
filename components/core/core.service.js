export default ['$rootScope', '$controller', '$injector', '$window', 'hs.map.service', 'config', '$timeout', 'hs.layout.service', '$log', '$document', 'hs.utils.service',
  function ($rootScope, $controller, $injector, $window, OlMap, config, $timeout, layoutService, $log, $document, utilsService) {
    const me = {
      hslayersNgTemplate: require('../../hslayers.html'),
      /**
      * @ngdoc property
      * @name Core#config
      * @public
      * @type {Object}
      * @description Service shortcut to config module defined by app.js for application
      */
      config: config,
      /**
      * @ngdoc property
      * @name Core#scopes_registered
      * @public
      * @type {Array}
      * @description DEPRECATED?
      */
      embededEnabled: true,
      /**
      * @ngdoc property
      * @name Core#_exist_cache
      * @public
      * @type {Object}
      * @description DEPRECATED?
      */
      _exist_cache: {},

      /**
      * @ngdoc property
      * @name Core#sizeOptions
      * @public
      * @type {Object}
      * @description Hold data for computing app sizes. Shouldnt be modified directly. Holds reference to HS app element and optionally its container.
      */
      sizeOptions: {
        element: undefined,
        windowedMap: undefined,
        selector: undefined
      },
      language: 'en',
      setMainPanel: function (which, by_gui) {
        $log.warn('setMainPanel will be removed from Core in future. Use hs.layout.service#setMainPanel method instead');
        layoutService.setMainPanel(which, by_gui);
      },
      setDefaultPanel: function (which) {
        $log.warn('setDefaultPanel will be removed from Core in future. Use hs.layout.service#setDefaultPanel method instead');
        return layoutService.setDefaultPanel(which);
      },
      panelVisible: function (which, scope) {
        $log.warn('panelVisible will be removed from Core in future. Use hs.layout.service#panelVisible method instead');
        return layoutService.panelVisible(which, scope);
      },
      panelEnabled: function (which, status) {
        $log.warn('panelEnabled will be removed from Core in future. Use hs.layout.service#panelEnabled method instead');
        return layoutService.panelEnabled(which, status);
      },
      closePanel: function (which) {
        $log.warn('closePanel will be removed from Core in future. Use hs.layout.service#closePanel method instead');
        return layoutService.closePanel(which);
      },
      fullScreenMap: function (element) {
        $log.warn('fullScreenMap will be removed from Core in future. Use hs.layout.service#fullScreenMap method instead');
        return layoutService.fullScreenMap(element, me);
      },
      get singleDatasources() {
        return config.allowAddExternalDatasets;
      },
      set singleDatasources(newName) {
        $log.warn('singleDatasources will be removed from Core in future. Use config.allowAddExternalDatasets instead or hide datasource_selector panel using config.panelsEnabled object');
        config.allowAddExternalDatasets = newName;
      },
      /**
      * @ngdoc method
      * @name Core#exists
      * @public
      * @param {String} name Controler or module name to test e.g. hs.print
      * @returns {Boolean} True if controller or module exists
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
      * @name Core#init
      * @public
      * @param {Object} element HS layers element gained from directive link
      * @param {Object} options Optional options object when HS app has not CSS sizes declared. Parent property is Boolean type when size should be taken from HS element parent. Element property is string for any css like selector
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
        if (angular.isDefined(options.innerElement) && $document[0].getElementById(options.innerElement.replace('#', ''))) {
          me.sizeOptions.innerElement = $document[0].getElementById(options.innerElement.replace('#', ''));
        }

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
      },
      /**
      * @ngdoc method
      * @name Core#setSizeByContainer
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
      * @name Core#setSizeByCSS
      * @public
      * @param {Number} height New height of HS element in pixels
      * @param {Number} width New width of HS element in pixels
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
      * @name Core#initSizeListeners
      * @public
      * @description Add event listeners for updating HS element and map size after browser resizing or complete load of application.
      */
      initSizeListeners: function () {
        const w = $window;
        /**
          * @ngdoc method
          * @name Core#updateVH
          * @private
          * @description Define and change size of CSS custom variable --vh used as reference for hs.app-height
          */
        const updateVH = utilsService.debounce(() => {
          if (me.sizeOptions.mode != 'fullscreen') {
            return;
          }
          const vh = w.innerHeight * 0.01;
          $document[0].documentElement.style.setProperty('--vh', `${vh}px`);
        }, 150, false, me);

        w.addEventListener('resize', () => {
          updateVH();
          angular.isUndefined(me.sizeOptions.selector) ? me.updateMapSize() : me.updateElementSize();
        });

        angular.isUndefined(me.sizeOptions.selector) ? me.updateMapSize() : me.updateElementSize();
        w.addEventListener('load', () => { //onload checker for cases when bootstrap css change box-sizing property
          angular.isUndefined(me.sizeOptions.selector) ? me.updateMapSize() : me.updateElementSize();
        });
      },
      /**
      * @ngdoc method
      * @name Core#updateElementSize
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
      * @name Core#updateMapSize
      * @public
      * @description Update map size.
      */
      updateMapSize: function () {
        const container = angular.isDefined(me.sizeOptions.innerElement) ? me.sizeOptions.innerElement : me.sizeOptions.element[0];
        const map = layoutService.contentWrapper.querySelector('.hs-ol-map');
        if (map === null) {
          return;
        }
        let sidebarElem = null;
        if (layoutService.contentWrapper.getElementsByClassName('hs-panelspace').length > 0) {
          sidebarElem = layoutService.contentWrapper.querySelector('.hs-panelspace');
        }
        const neededSize = {width: 0, height: container.clientHeight};

        if (me.puremapApp) {
          neededSize.width = container.offsetWidth;
        } else if (sidebarElem === null) {
          neededSize.width = container.offsetWidth;
        } else if (sidebarElem !== null && container.offsetWidth > sidebarElem.offsetWidth) {
          neededSize.width = container.offsetWidth - sidebarElem.offsetWidth;
        }
        // map.style.height = neededSize.height + 'px';
        // map.style.width = neededSize.width + 'px';
        if (angular.isDefined(OlMap.map)) {
          OlMap.map.updateSize();
          $timeout(()=>{
            map.offsetWidth < 767 ? layoutService.smallWidth = true : layoutService.smallWidth = false;
          }, 0);
        }

        $rootScope.$broadcast('Core.mapSizeUpdated', neededSize);
      },

      /**
      * @ngdoc method
      * @name Core#searchVisible
      * @public
      * @param {booelan} is New status of search panel
      * @returns {Boolean} Current status of Search panel
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
      * @name Core#isAuthorized
      * @public
      * @returns {Boolean} Check result - true for authorized user
      * @description Do authorization check of User, currently authorization is possible only in connection with Lifearray app
      */
      isAuthorized: function () {
        if (angular.isUndefined($window.getLRUser) && angular.isUndefined(me.missingLRFunctionsWarned)) {
          if (console) {
            $log.warn('window.getLRUser function needs to be defined, which usually comes from liferay.');
          }
          me.missingLRFunctionsWarned = true;
        }
        if (angular.isDefined($window.getLRUser) && $window.getLRUser() != 'guest') {
          return true;
        }
        return true;
      },
      /**
      * @ngdoc method
      * @name Core#resetMap
      * @public
      * @description Do complete reset of map (view, layers) according to app config
      */
      resetMap: function () {
        OlMap.reset();
        /**
        * @ngdoc event
        * @name Core#core.map_reset
        * @eventType broadcast on $rootScope
        * @description Fires when map completely reset
        */
        $rootScope.$broadcast('core.map_reset', {});
      },
      /**
      * @ngdoc method
      * @name Core#isMobile
      * @public
      * @returns {String} Returns "mobile" or ""
      * @description Test if screen of used device is mobile type (current breakdown is screen width 800px)
      */
      isMobile: function () {
        if ($window.cordova) {
          return 'mobile';
        } else {
          return '';
        }
      }
    };

    let _puremapApp = false;
    /**
    * @ngdoc property
    * @name Core#puremapApp
    * @public
    * @type {Boolean} false
    * @description If app is running in puremapApp mode
    */
    Object.defineProperty(me, 'puremapApp', {
      get: function () {
        return _puremapApp;
      },
      set: function (value) {
        _puremapApp = value;
        if (value) {
          layoutService.sidebarVisible(false);
        }
      }
    });

    if (me.exists('hs.sidebar.controller') /*&& me.puremapApp != true*/) {
      if ($window.innerWidth < 767 || config.sidebarClosed) {
        layoutService.sidebarExpanded = false;
        layoutService.sidebarLabels = false;
      } else {
        layoutService.sidebarExpanded = true;
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
  }];
