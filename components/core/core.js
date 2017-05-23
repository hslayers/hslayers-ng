/**
 * @namespace hs
 */

/**
 * @ngdoc module
 * @module hs.core
 * @name hs.core
 * @description Core module for whole HSLayers-NG. Contain paths to all other HS modules and dependencies (therefore it is not needed to specify them in hslayers.js file). Core module consists of Core service which keeps some app-level settings and mantain app size and panel statuses.
 */
require.config({
    paths: {
        dc: requirejs.s.contexts._.config.paths.dc || '//cdnjs.cloudflare.com/ajax/libs/dc/1.7.0/dc',
        ol: requirejs.s.contexts._.config.paths.ol || hsl_path + 'node_modules/openlayers/dist/ol',

        angular: hsl_path + 'bower_components/angular/angular.min',
        'angular-sanitize': hsl_path + 'bower_components/angular-sanitize/angular-sanitize',
        'angular-gettext': hsl_path + 'bower_components/angular-gettext/dist/angular-gettext',
        'angularjs-socialshare': hsl_path + 'bower_components/angularjs-socialshare/dist/angular-socialshare',
        bootstrap: requirejs.s.contexts._.config.paths.bootstrap || hsl_path + 'bower_components/bootstrap/dist/js/bootstrap',
        crossfilter: requirejs.s.contexts._.config.paths.crossfilter || hsl_path + 'bower_components/crossfilter/crossfilter.min',
        draw: hsl_path + 'components/draw/draw',
        d3: requirejs.s.contexts._.config.paths.d3 || hsl_path + 'bower_components/d3/d3.min',
        ngcookies: hsl_path + 'bower_components/angular-cookies/angular-cookies',
        proj4: requirejs.s.contexts._.config.paths.proj4 || hsl_path + 'bower_components/proj4/dist/proj4',
        xml2json: requirejs.s.contexts._.config.paths.xml2json || hsl_path + 'bower_components/xml2json/xml2json.min',
        api: requirejs.s.contexts._.config.paths.api || hsl_path + 'components/api/api',
        compositions: hsl_path + 'components/compositions/compositions',
        datasource_selector: hsl_path + 'components/datasource_selector/datasource_selector',
        drag: hsl_path + 'components/drag/drag',
        geojson: requirejs.s.contexts._.config.paths.geojson || hsl_path + 'components/layers/hs.source.GeoJSON',
        geolocation: requirejs.s.contexts._.config.paths.geolocation || hsl_path + 'components/geolocation/geolocation',
        info: requirejs.s.contexts._.config.paths['info'] || hsl_path + 'components/info/info',
        layermanager: hsl_path + 'components/layermanager/layermanager',
        legend: hsl_path + 'components/legend/legend',
        lodexplorer: hsl_path + 'components/lodexplorer/lodexplorer',
        map: hsl_path + 'components/map/map',
        measure: hsl_path + 'components/measure/measure',
        mobile_toolbar: requirejs.s.contexts._.config.paths.mobile_toolbar || hsl_path + 'components/mobile_toolbar/mobile_toolbar',
        mobile_settings: requirejs.s.contexts._.config.paths.mobile_settings || hsl_path + 'components/mobile_settings/mobile_settings',
        ows: hsl_path + 'components/ows/ows',
        'ows.nonwms': hsl_path + 'components/ows/ows_nonwms',
        'ows.wfs': hsl_path + 'components/ows/ows_wfs',
        'ows.wms': hsl_path + 'components/ows/ows_wms',
        'ows.wmts': hsl_path + 'components/ows/ows_wmts',
        'ows.wmsprioritized': hsl_path + 'components/ows/ows_wmsprioritized',
        panoramio: hsl_path + 'components/layers/panoramio/panoramio',
        permalink: requirejs.s.contexts._.config.paths.permalink || hsl_path + 'components/permalink/permalink',
        print: hsl_path + 'components/print/print',
        query: hsl_path + 'components/query/query',
        sidebar: requirejs.s.contexts._.config.paths.sidebar || hsl_path + 'components/sidebar/sidebar',
        search: hsl_path + 'components/search/search',
        SparqlJson: requirejs.s.contexts._.config.paths.SparqlJson || hsl_path + 'components/layers/hs.source.SparqlJson',
        status_creator: hsl_path + 'components/status_creator/status_creator',
        styles: hsl_path + 'components/styles/styles',
        toolbar: requirejs.s.contexts._.config.paths.toolbar || hsl_path + 'components/toolbar/toolbar',
        translations: requirejs.s.contexts._.config.paths.translations || hsl_path + 'components/translations/js/translations',
        utils: hsl_path + 'components/utils',
        WFSCapabilities: requirejs.s.contexts._.config.paths.WFSCapabilities || hsl_path + 'components/format/hs.format.WFSCapabilities',
        WfsSource: requirejs.s.contexts._.config.paths.WfsSource || hsl_path + 'components/layers/hs.source.Wfs',
        routing: hsl_path + 'components/routing/routing',
        tracking: hsl_path + 'components/tracking/tracking',
        s4a: requirejs.s.contexts._.config.paths.s4a || hsl_path + 'bower_components/s4a-js/dist/s4a.min',
        'dragdroplists': hsl_path + 'bower_components/angular-drag-and-drop-lists/angular-drag-and-drop-lists',
        'ngfocusif': hsl_path + 'bower_components/ng-focus-if/focusIf.min',
        'updateMeta': hsl_path + 'bower_components/angular-update-meta/dist/update-meta',
        socketio: hsl_path + 'bower_components/socket.io-client/socket.io',
        rtserver: requirejs.s.contexts._.config.paths.rtserver || hsl_path + 'components/rtserver/rtserver',
        config_parsers: hsl_path + 'components/compositions/config_parsers'
    },
    shim: {
        'angular': {
            'exports': 'angular'
        },
        'angularjs-socialshare': {
            deps: ['angular']
        },
        'ngfocusif': {
            deps: ['angular']
        },
        'angular-sanitize': {
            deps: ['angular'],
        },
        'dragdroplists': {
            deps: ['angular'],
        },
        'updateMeta': {
            deps: ['angular'],
        },
        'angular-gettext': {
            deps: ['angular'],
        },
        ngcookies: {
            deps: ['angular'],
        },
        translations: {
            deps: ['angular-gettext'],
        }
    },
    priority: [
        "angular"
    ]
});

define(['angular', 'angular-gettext', 'translations', 'ol', 'map', 'drag', 'api', 'proj4'],
    function(angular, proj4) {
        angular.module('hs.core', ['hs.map', 'gettext', 'gettext', 'hs.drag', 'hs.api'])
            /**
             * @module hs.core
             * @name Core
             * @ngdoc service
             * @description Core service of HSL and Core module, keeps important app-level settings.
             */
            .service("Core", ['$rootScope', '$controller', '$window', 'hs.map.service', 'gettextCatalog', 'config', '$templateCache',
                function($rootScope, $controller, $window, OlMap, gettextCatalog, config, $templateCache) {
                    var me = {
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
                        * @name Core#mainpanel
                        * @public
                        * @type {String} null 
                        * @description Storage of current main panel (panel which is opened). When {@link Core#defaultPanel defaultPanel} is specified, main panel is set to it during Core initialization.
                        */
                        mainpanel: "",
                        /**
                        * @ngdoc property
                        * @name Core#defaultPanel
                        * @public
                        * @type {String} null 
                        * @description Storage of default (main) panel (panel which is opened during initialization of app and also when other panel than default is closed). 
                        */
                        defaultPanel: "",
                        /**
                        * @ngdoc property
                        * @name Core#sidebarExpanded
                        * @public
                        * @type {Boolean} false 
                        * @description Show if any sidebar panel is opened (sidebar is completely expanded). When hs.sidebar module is used in app, it change automatically to true during initialization.
                        */
                        sidebarExpanded: false,
                        /**
                        * @ngdoc property
                        * @name Core#sidebarRight
                        * @public
                        * @type {Boolean} true 
                        * @description Side on which sidebar will be shown (true - right side of map, false - left side of map)
                        */
                        sidebarRight: true,
                        /**
                        * @ngdoc property
                        * @name Core#sidebarLabels
                        * @public
                        * @type {Boolean} true 
                        * @description DEPRECATED? (labels display is done with CSS classes)
                        */
                        sidebarLabels: true,
                        /**
                        * @ngdoc property
                        * @name Core#sidebarToggleable
                        * @public
                        * @type {Boolean} true 
                        * @description Enable sidebar function to open/close sidebar (if false sidebar panel cannot be opened/closed through GUI)
                        */
                        sidebarToggleable: true,
                        /**
                        * @ngdoc property
                        * @name Core#sidebarButtons
                        * @public
                        * @type {Boolean} true 
                        * @description DEPRECATED?
                        */
                        sidebarButtons: true,
                        classicSidebar:true,
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
                        * @name Core#smallWidth
                        * @public
                        * @type {Boolean} false 
                        * @description Helper property for showing some button on smaller screens
                        */
                        smallWidth: false,
                        /**
                        * @ngdoc property
                        * @name Core#panel_statuses
                        * @public
                        * @type {Object} 
                        * @description DEPRACATED?
                        */
                        panel_statuses: {},
                        /**
                        * @ngdoc property
                        * @name Core#panel_enabled
                        * @public
                        * @type {Object}  
                        * @description DEPRACATED?
                        */
                        panel_enabled: {},
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
                        * @name Core#current_panel_queryable
                        * @public
                        * @type {Boolean} false 
                        * @description Keep queryable status of current panel
                        */
                        current_panel_queryable: false,
                        /**
                        * @ngdoc property
                        * @name Core#hsSize
                        * @public
                        * @type {Object} 
                        * @description Size (height and width) of hs ng-app (stored in px or %). 
                        * Example
                         * ```
                         * {height: "100%", width: "100%"}
                         * ```
                        */
                        hsSize: {height: "100%",width: "100%"},
                        /**
                        * @ngdoc property
                        * @name Core#puremapApp
                        * @public
                        * @type {Boolean} false 
                        * @description If app is running in puremapApp mode
                        */
                        puremapApp: false,
                        /**
                        * @ngdoc method
                        * @name Core#setMainPanel 
                        * @public
                        * @param {String} which New panel to activate (panel name)
                        * @param {Boolean} by_gui Whether function call came as result of GUI action
                        * @param {Boolean} queryable If map should be queryable with new mainpanel. When parameter ommited, map enable queries.
                        * @description Sets new main panel (Panel displayed in expanded sidebar). Change GUI and queryable status of map (when queryable and with hs.query component in app, map does info query on map click).
                        */
                        setMainPanel: function(which, by_gui, queryable) {
                            if (which == me.mainpanel && by_gui) {
                                which = "";
                                if (me.sidebarExpanded == true) {
                                    me.sidebarLabels = true;
                                }
                            } else {
                                me.sidebarExpanded = true;
                                me.sidebarLabels = false;
                            }
                            me.mainpanel = which;
                            if (typeof queryable == 'undefined')
                                me.current_panel_queryable = true;
                            else
                                me.current_panel_queryable = queryable;
                            if (!$rootScope.$$phase) $rootScope.$digest();
                            /**
                            * @ngdoc event
                            * @name Core#core.mainpanel_changed
                            * @eventType broadcast on $rootScope
                            * @description Fires when current mainpanel change - toggle, change of opened panel
                            */
                            $rootScope.$broadcast('core.mainpanel_changed');
                        },
                        /**
                        * @ngdoc method
                        * @name Core#setDefaultPanel 
                        * @public
                        * @param {String} which New panel to be default (specify panel name)
                        * @description Sets new default panel (Panel which is opened first and which displayed if previous active panel is closed)
                        */
                        setDefaultPanel: function(which) {
                            me.defaultPanel = which;
                            me.setMainPanel(which);
                        },
                        /**
                        * @ngdoc method
                        * @name Core#updateMapSize 
                        * @public
                        * @param {String} which New panel to be default (specify panel name)
                        * @description Change size of map element in application. Size should be rest of window width next to sidebar
                        */
                        updateMapSize: function() {
                            var element = $("div[hs]");
                            var map = $("#map");
                            var sidebarElem = $('.panelspace');
                            if (me.puremapApp) {
                                map.width(element.width());
                            }
                            else if (element.width() > sidebarElem.width()) {
                                map.width(element.width() - sidebarElem.width());
                            } 
                            else {
                                map.width(0);
                            }
                            if(angular.isDefined(OlMap.map)) OlMap.map.updateSize();
                            map.width() < 368 ? me.smallWidth = true : me.smallWidth = false;
                            if (!$rootScope.$$phase) $rootScope.$digest();
                        },
                        /**
                        * @ngdoc method
                        * @name Core#panelVisible 
                        * @public
                        * @param {String} which Name of panel to test
                        * @param {$scope} scope Angular scope of panels controller (optional, needed for test of unpinned panels)
                        * @returns {Boolean} Panel opened/closed status
                        * @description Find if selected panel is currently opened (in sidebar or as unpinned window)
                        */
                        panelVisible: function(which, scope) {
                            if (angular.isDefined(scope))
                                if (angular.isUndefined(scope.panel_name)) scope.panel_name = which;
                            if (angular.isDefined(me.panel_statuses[which])) {
                                return me.panel_statuses[which];
                            }
                            return me.mainpanel == which || (angular.isDefined(scope) && scope.unpinned);
                        },
                        /**
                        * @ngdoc method
                        * @name Core#panelEnabled 
                        * @public
                        * @param {String} which Selected panel (panel name)
                        * @param {Boolean} status Visibility status of panel to set
                        * @returns {Boolean} Panel enabled/disabled status for getter function
                        * @description Get or set panel visibility in sidebar. When panel is disabled it means that it's not displayed in sidebar (it can be opened programmaticaly) but it's functionality is running. Use with status parameter as setter.
                        */
                        panelEnabled: function(which, status) {
                            if (typeof status == 'undefined') {
                                if (angular.isDefined(me.panel_enabled[which]))
                                    return me.panel_enabled[which];
                                else
                                    return true;
                            } else
                                me.panel_enabled[which] = status;
                        },
                        /**
                        * @ngdoc method
                        * @name Core#hidePanels 
                        * @public
                        * @description Close opened panel programmaticaly. If sidebar toolbar is used in app, sidebar stay expanded with sidebar labels. Cannot resolve unpinned panels.
                        */
                        hidePanels: function() {
                            me.mainpanel = '';
                            me.sidebarLabels = true;
                            if (!me.exists('hs.sidebar.controller')) {
                                me.sidebarExpanded = false
                            }
                            if (!$rootScope.$$phase) $rootScope.$digest();
                            $rootScope.$broadcast('core.mainpanel_changed');
                        },
                        /**
                        * @ngdoc method
                        * @name Core#closePanel 
                        * @public
                        * @param {Object} which Panel to close (panel scope)
                        * @description Close selected panel (either unpinned panels or actual mainpanel). If default panel is defined, it is opened instead.
                        */
                        closePanel: function(which) {
                            if (which.unpinned) {
                                which.drag_panel.appendTo($(which.original_container));
                                which.drag_panel.css({
                                    top: 'auto',
                                    left: 'auto',
                                    position: 'relative'
                                });
                            }
                            which.unpinned = false;
                            if (which.panel_name == me.mainpanel) {
                                if (me.defaultPanel != '') {
                                    me.setMainPanel(me.defaultPanel)
                                } else {
                                    me.mainpanel = '';
                                    me.sidebarLabels = true;
                                }
                                if (!me.exists('hs.sidebar.controller')) {
                                    me.sidebarExpanded = false
                                }

                            }

                            $rootScope.$broadcast('core.mainpanel_changed',which);
                        },
                        /**
                        * @ngdoc method
                        * @name Core#exists 
                        * @public
                        * @param {String} controllerName Controler to test (angular name of controller)
                        * @returns {Boolean} Controller existence
                        * @description Test if selected panel controller is defined in application.
                        */
                        exists: function(controllerName) {
                            if (angular.isDefined(me._exist_cache[controllerName])) return true;
                            if (typeof window[controllerName] == 'function') {
                                return true;
                            }
                            try {
                                $controller(controllerName);
                                me._exist_cache[controllerName] = true;
                                return true;
                            } catch (error) {
                                var t = !(error instanceof TypeError);
                                if (t) me._exist_cache[controllerName] = true;
                                return t;
                            }
                        },
                        /**
                        * @ngdoc method
                        * @name Core#init 
                        * @public
                        * @params {Object} element HS layers element gained from directive link
                        * @params {Array|String} value Type of initialization, possible options: (undefined - full window app, "self" - size of hs element setted by css, only pixel values, "parent" - take size from parent element, "id" - ID of another element from which size should be taken, if its direct parent element, parent option is recommended)
                        * @description Universal function for initialization of HSLayers template and setting correct size to it. Take all posible inputs and switch to correct application size setter. Turn on all neceserary event listeners for resizing HSLayers element.
                        */
                        init: function(element, value) {
                            if (typeof(value) == undefined) {
                                me.fullScreenMap(element);
                            }
                            else if (value == "self") {
                                me.appSize(element,element);
                            }
                            else if (value == "parent") {
                                me.appSize(element,element.parent());
                            }
                            else {
                                var id = "#" + value;
                                me.appSize(element,$(id));
                            }
                        },
                        /**
                        * @ngdoc method
                        * @name Core#fullScreenMap 
                        * @public
                        * @param {Object} element Element to resize while going fullscreen
                        * @description Utility function for initialization of app, when app take whole window
                        */
                        fullScreenMap: function(element) {
                            $("html").css('overflow', 'hidden');
                            $("html").css('height', '100%');
                            $('body').css('height', '100%');
                            var w = angular.element($window);
                            me.appSize(element, w);
                        },
                        /**
                        * @ngdoc method
                        * @name Core#appSize 
                        * @public
                        * @param {Object} element HS element, for which size is set
                        * @param {Object} container Base containing element for resizing, either element or window object
                        * @description Set right size of app in page, starts event listeners for events which lead to changing app size (window resizing, change of app settings)
                        */
                        appSize: function(element, container) {
                            me.changeSize(element, container);
                            var w = angular.element($window);
                            w.resize(function(){
                                me.changeSize(element, container);
                            });
                            $rootScope.$on("Core_sizeChanged",function(){
                                me.changeSize(element, container);
                            });
                            $(function() { //onload checker for cases when bootstrap css change box-sizing property
                                me.changeSize(element, container);
                            });
                        },
                        /**
                        * @ngdoc method
                        * @name Core#changeSize 
                        * @public
                        * @params {Object} element Angular object containing app element
                        * @params {Object} container Base element object, to get requested size
                        * @description Check current size of containing element and change setting of HS element
                        */
                        changeSize: function(element,container) {
                            if (element === container && me.hsSize.height.indexOf("%") > -1) {
                                var size = getSize(element.parent(),me.hsSize); 
                            }
                            else {
                                var size = getSize(container,me.hsSize);    
                            }
                            var size = getSize(container,me.hsSize);
                            element[0].style.height = size.height + "px";
                            element[0].style.width = size.width + "px";
                            $("#map").height(size.height);
                            me.updateMapSize();
                        },
                        /**
                        * @ngdoc method
                        * @name Core#changeSizeConfig
                        * @public
                        * @param {String} newHeight New height setting for app (Pixel or percentage value e.g. '960px'/'100%')
                        * @param {String} newWidth New width setting for app (Pixel or percentage value e.g. '960px'/'100%')
                        * @description Change max height and width of app element (when app width is set by JS)
                        */
                        changeSizeConfig: function(newHeight, newWidth) {
                            me.hsSize.height = newHeight;
                            me.hsSize.width = newWidth;
                            /**
                            * @ngdoc event
                            * @name Core#Core_sizeChanged
                            * @eventType broadcast on $rootScope
                            * @description Fires when height/width settings are changed
                            */
                            $rootScope.$broadcast("Core_sizeChanged");
                        },
                        /**
                        * @ngdoc method
                        * @name Core#setLanguage 
                        * @public
                        * @param {String} lang Language to select
                        * @description Set current active language for translating. (Currently cs and nl options supported).
                        */
                        setLanguage: function(lang) {
                            switch (lang) {
                                case "cs_CZ":
                                    lang = 'cs';
                                    break;
                                case "nl_BE":
                                    lang = 'nl';
                                    break;
                            }
                            gettextCatalog.setCurrentLanguage(lang);
                        },
                        /**
                        * @ngdoc method
                        * @name Core#openStatusCreator 
                        * @public
                        * @description Open status creator panel
                        */
                        openStatusCreator: function() {
                            //me.panel_statuses.status_creator = true;
                            hslayers_api.gui.StatusCreator.open();
                        },
                        /**
                        * @ngdoc method
                        * @name Core#searchVisible 
                        * @public
                        * @param {booelan} is New status of search panel
                        * @returns {Boolean} Current status of Search panel
                        * @description DEPRECATED?
                        */
                        searchVisible: function(is) {
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
                        isAuthorized: function() {
                            if (angular.isDefined(window.getLRUser) && window.getLRUser() != 'guest') {
                                return true;
                            }
                            return false;
                        },
                        /**
                        * @ngdoc method
                        * @name Core#resetMap
                        * @public
                        * @description Do complete reset of map (view, layers) according to app config
                        */
                        resetMap: function() {
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
                        isMobile: function() {
                            if (screen.width < 800) {
                                return "mobile";
                            } else {
                                return "";
                            }
                        }
                    };

                    $templateCache.removeAll();

                    if (me.exists('hs.sidebar.controller') /*&& me.puremapApp != true*/) {
                        me.sidebarExpanded = true;
                    }

                    if (me.defaultPanel != '') {
                        me.setMainPanel(me.defaultPanel);
                    }

                    /* HACK: https://github.com/openlayers/ol3/issues/3990 */
                    try {
                        if (typeof require('proj4') != undefined) {
                            require(['proj4'], function() {
                                window.proj4 = proj4
                            });
                        }
                    } catch (ex) {
                        require(['proj4'], function() {
                            window.proj4 = proj4
                        });
                    }
                    /**
                    * @ngdoc method
                    * @name Core#getSize
                    * @private
                    * @params {Object} container Container element to get maximum avaible size for app element
                    * @params {Object} maxSize Maximum configured size of App element
                    * @params {Boolean} overflow If computed app size can overflow browser window (default is true)
                    * @returns {Object} Computed size of element
                    * @description Transform configured Size of app element to pixel numbers, optionally checks if window is not smaller than app settings
                    */
                    function getSize(container, maxSize, overflow) {
                        var size = {};
                        if (typeof overflow == "undefined") overflow = true;
                        if (maxSize.height.indexOf("%") > -1) {
                            size.height = Math.round( container.height() / 100 * maxSize.height.slice(0,-1));
                            size.width = Math.round( container.width() / 100 * maxSize.width.slice(0,-1));
                        }
                        else {
                            maxSize.height.indexOf("px") > -1 ? size.height = maxSize.height.slice(0,-2) : size.height = maxSize.height;
                            if (size.height < container.height() && !(overflow)) size.height = container.height();
                            maxSize.width.indexOf("px") > -1 ? size.width = maxSize.width.slice(0,-2) : size.width = maxSize.width;
                            if (size.width < container.width() && !(overflow)) size.width = container.width();
                        }
                        return size;
                    };

                    /**
                    * @ngdoc method
                    * @name Core#changeSize 
                    * @public
                    * @params {Object} w Angular object containing window, to get window size
                    * @params {Object} element Angular object containing app element
                    * @description Helper function for changing app size
                    */
                    function changeSize(w,element) {
                        var size = getSize(w,me.size);
                        element[0].style.height = size.height + "px";
                        element[0].style.width = size.width + "px";
                        $("#map").height(size.height);
                        me.updateMapSize();
                        if(OlMap.map) OlMap.map.updateSize();
                    }
                    return me;
                },

            ]);
    })
