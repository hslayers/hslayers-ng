import '../layout/layout.module';
import 'angular-gettext';
import 'translations';
import '../map/map.module';
import '../drag/drag.module';

/**
 * @namespace hs
 * @ngdoc module
 * @module hs.core
 * @name hs.core
 * @description Core module for whole HSLayers-NG. Contains paths to all other HS modules and dependencies (therefore it is not needed to specify them in hslayers.js file). Core module consists of Core service which keeps some app-level settings and mantain app size and panel statuses.
 */

angular.module('hs.core', ['hs.map', 'gettext', 'hs.drag', 'hs.layout'])
    /**
     * @module hs.core
     * @name Core
     * @ngdoc service
     * @description Core service of HSL and Core module, keeps important app-level settings.
     */
    .service("Core", ['$rootScope', '$controller', '$injector', '$window', 'hs.map.service', 'gettextCatalog', 'config', '$templateCache', '$timeout', 'hs.layout.service',
        function ($rootScope, $controller, $injector, $window, OlMap, gettextCatalog, config, $templateCache, $timeout, layoutService) {
            if (angular.isUndefined(config.hsl_path) && window.hsl_path) config.hsl_path = hsl_path;
            var me = {
                hslayersNgTemplate: require('hslayers.html'),
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
                scopes_registered: [],            
                /**
                * @ngdoc property
                * @name Core#singleDatasources
                * @public
                * @type {Boolean} false 
                * @description If true, datasource can be added to app only through Datasource selector panel (in GUI)
                */
                singleDatasources: false,
                /**
                * @ngdoc property
                * @name Core#embededEnabled
                * @public
                * @type {Boolean} true 
                * @description If map can be shared as embeded frame
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
                    console.warn('setMainPanel will be removed from Core in future. Use hs.layout.service#setMainPanel method instead');
                    layoutService.setMainPanel(which, by_gui)
                },
                setDefaultPanel: function (which) {
                    console.warn('setDefaultPanel will be removed from Core in future. Use hs.layout.service#setDefaultPanel method instead');
                    return layoutService.setDefaultPanel(which);
                },
                panelVisible: function (which, scope) {
                    console.warn('panelVisible will be removed from Core in future. Use hs.layout.service#panelVisible method instead');
                    return layoutService.panelVisible(which, scope);
                },
                panelEnabled: function (which, status) {
                    console.warn('panelEnabled will be removed from Core in future. Use hs.layout.service#panelEnabled method instead');
                    return layoutService.panelEnabled(which, status);
                },
                closePanel: function (which) {
                    console.warn('closePanel will be removed from Core in future. Use hs.layout.service#closePanel method instead');
                    return layoutService.closePanel(which)
                },
                fullScreenMap: function (element) {     
                    console.warn('fullScreenMap will be removed from Core in future. Use hs.layout.service#fullScreenMap method instead');
                    return layoutService.fullScreenMap(element,me)
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
                    if (angular.isDefined(me._exist_cache[name])) return true;
                    if (name in $injector.modules) {
                        me._exist_cache[name] = true;
                        return true;
                    }
                    try {
                        $controller(name);
                        me._exist_cache[name] = true;
                        return true;
                    } catch (error) {
                        var t = !(error instanceof TypeError);
                        if (t) me._exist_cache[name] = true;
                        return t;
                    }
                },
                /**
                * @ngdoc method
                * @name Core#init 
                * @public
                * @params {Object} element HS layers element gained from directive link
                * @params {Object} options Optional options object when HS app has not CSS sizes declared. Parent property is Boolean type when size should be taken from HS element parent. Element property is string for any Jquery selector (usage of element id is recommended e.g. "#container")
                * @description Initialization function for HS layers elements and their sizes. Stores element and container references and sets event listeners for map resizing.
                */
                init: function (element, options) {
                    if (me.initCalled) return;
                    if (angular.isUndefined(options)) options = {};
                    if (angular.isDefined(options.windowedMap)) me.sizeOptions.windowedMap = options.windowedMap;
                    me.sizeOptions.element = element;
                    if (angular.isDefined(options.innerElement) && document.getElementById(options.innerElement.replace('#', '')))
                        me.sizeOptions.innerElement = document.getElementById(options.innerElement.replace('#', ''));

                    if (angular.isDefined(options.parent)) {
                        me.sizeOptions.selector = element.parent();
                        me.initSizeListeners();
                        me.updateElementSize();
                    }
                    else if (angular.isDefined(options.element)) {
                        me.sizeOptions.selector = options.element;
                        me.initSizeListeners();
                        me.updateElementSize();
                    }
                    else {
                        me.initSizeListeners();
                        me.updateMapSize();
                    }
                    me.initCalled = true;
                },
                /**
                * @ngdoc method
                * @name Core#setSizeByContainer 
                * @public
                * @params {String|Boolean} container New container for size referencing (options - string Jquery selector - see Init function, Boolean 'true' value for parent of HS element)
                * @description Change container for HS element.
                */
                setSizeByContainer: function (container) {
                    if (container == true) me.sizeOptions.selector = me.sizeOptions.element.parent();
                    else me.sizeOptions.selector = options.element;
                    me.updateElementSize();
                },
                /**
                * @ngdoc method
                * @name Core#setSizeByContainer 
                * @public
                * @params {Number} height New height of HS element
                * @params {Number} width New width of HS element
                * @description Change HS element size programmatically (currently accept only integer value of pixels).
                */
                setSizeByCSS: function (height, width) {
                    if (angular.isDefined(me.sizeOptions.selector)) me.sizeOptions.selector = undefined;
                    var element = me.sizeOptions.element;
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
                    var w = $window;
                    /**
                    * @ngdoc method
                    * @name Core#updateVH 
                    * @private
                    * @description Define and change size of CSS custom variable --vh used as reference for hs.app-height
                    */
                    let updateVH = _.debounce(() => {
                    if (me.sizeOptions.mode != "fullscreen") return
                    let vh = w.innerHeight * 0.01;
                      document.documentElement.style.setProperty('--vh', `${vh}px`);
                    }, 150);

                    w.addEventListener('resize', function () {
                        updateVH();
                        angular.isUndefined(me.sizeOptions.selector) ? me.updateMapSize() : me.updateElementSize();
                    });
                    
                    me.sizeOptions.selector == undefined ? me.updateMapSize() : me.updateElementSize();
                    w.addEventListener("load", function () { //onload checker for cases when bootstrap css change box-sizing property
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
                    var element = me.sizeOptions.element[0];
                    var container = me.sizeOptions.selector[0];
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
                    var container = angular.isDefined(me.sizeOptions.innerElement) ? me.sizeOptions.innerElement : me.sizeOptions.element[0];
                    var map = document.getElementById("map");
                    if (map == null) return;
                    var sidebarElem = null;
                    if (document.getElementsByClassName('panelspace').length > 0)
                        sidebarElem = document.getElementsByClassName('panelspace')[0];
                    var neededSize = { width: 0, height: container.clientHeight };

                    if (me.puremapApp) {
                        neededSize.width = container.offsetWidth;
                    }
                    else if (sidebarElem == null) {
                        neededSize.width = container.offsetWidth;
                    } else if (sidebarElem != null && container.offsetWidth > sidebarElem.offsetWidth) {
                        neededSize.width = container.offsetWidth - sidebarElem.offsetWidth;
                    }
                    // map.style.height = neededSize.height + 'px';
                    // map.style.width = neededSize.width + 'px';
                    if (angular.isDefined(OlMap.map)) OlMap.map.updateSize();
                    map.offsetWidth < 767 ? layoutService.smallWidth = true : layoutService.smallWidth = false;
                    if (!$rootScope.$$phase) $rootScope.$digest();
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
                    return me.panel_statuses['search']
                },
                /**
                * @ngdoc method
                * @name Core#isAuthorized 
                * @public
                * @returns {Boolean} Check result - true for authorized user
                * @description Do authorization check of User, currently authorization is possible only in connection with Lifearray app
                */
                isAuthorized: function () {
                    if (!angular.isDefined(window.getLRUser) && angular.isUndefined(me.missingLRFunctionsWarned)) {
                        if (console) console.warn('window.getLRUser function needs to be defined, which usually comes from liferay.');
                        me.missingLRFunctionsWarned = true;
                    }
                    if (angular.isDefined(window.getLRUser) && window.getLRUser() != 'guest') {
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
                    if (!!window.cordova) {
                        return "mobile";
                    } else {
                        return "";
                    }
                },
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
                get: function() {
                    return _puremapApp;
                },
                set: function(value) {
                   _puremapApp = value;
                   if(!value) layoutService.sidebarVisible(false);
                }
            });

            $templateCache.removeAll();

            if (me.exists('hs.sidebar.controller') /*&& me.puremapApp != true*/) {
                if(window.innerWidth < 767){layoutService.sidebarExpanded = false;}
                else{layoutService.sidebarExpanded = true;}
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
        },

    ]);
