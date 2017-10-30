/**
 * @namespace hs
 */

/**
 * @ngdoc module
 * @module hs.core
 * @name hs.core
 * @description Core module for whole HSLayers-NG. Contain paths to all other HS modules and dependencies (therefore it is not needed to specify them in hslayers.js file). Core module consists of Core service which keeps some app-level settings and mantain app size and panel statuses.
 */
if (typeof hslMin != 'undefined') {
    if (hslMin == true) hslMin = '.min';
    else hslMin = '';
} 
else hslMin = '';
if(console) console.log(hslMin);

require.config({
    paths: {
        dc: requirejs.s.contexts._.config.paths.dc || '//cdnjs.cloudflare.com/ajax/libs/dc/1.7.0/dc',
        ol: requirejs.s.contexts._.config.paths.ol || hsl_path + ((hslMin == '.min') ? 'node_modules/openlayers/dist/ol' : 'node_modules/openlayers/dist/ol-debug'),

        angular: hsl_path + 'bower_components/angular/angular' + hslMin,
        'angular-sanitize': hsl_path + 'bower_components/angular-sanitize/angular-sanitize' + hslMin,
        'angular-gettext': hsl_path + 'bower_components/angular-gettext/dist/angular-gettext' + hslMin,
        'angularjs-socialshare': hsl_path + 'bower_components/angularjs-socialshare/dist/angular-socialshare' + hslMin,
        bootstrap: requirejs.s.contexts._.config.paths.bootstrap || hsl_path + 'bower_components/bootstrap/dist/js/bootstrap' + hslMin,
        crossfilter: requirejs.s.contexts._.config.paths.crossfilter || hsl_path + 'bower_components/crossfilter/crossfilter' + hslMin,
        draw: hsl_path + 'components/draw/draw',
        d3: requirejs.s.contexts._.config.paths.d3 || hsl_path + 'bower_components/d3/d3' + hslMin,
        ngcookies: hsl_path + 'bower_components/angular-cookies/angular-cookies' + hslMin,
        proj4: requirejs.s.contexts._.config.paths.proj4 || hsl_path + 'bower_components/proj4/dist/proj4',
        xml2json: requirejs.s.contexts._.config.paths.xml2json || hsl_path + 'bower_components/xml2json/xml2json',
        api: requirejs.s.contexts._.config.paths.api || hsl_path + 'components/api/api' + hslMin,
        compositions: hsl_path + 'components/compositions/compositions' + hslMin,
        datasource_selector: hsl_path + 'components/datasource_selector/datasource_selector' + hslMin,
        drag: hsl_path + 'components/drag/drag' + hslMin,
        geojson: requirejs.s.contexts._.config.paths.geojson || hsl_path + 'components/layers/hs.source.GeoJSON' + hslMin,
        geolocation: requirejs.s.contexts._.config.paths.geolocation || hsl_path + 'components/geolocation/geolocation' + hslMin,
        info: requirejs.s.contexts._.config.paths['info'] || hsl_path + 'components/info/info' + hslMin,
        layermanager: hsl_path + 'components/layermanager/layermanager' + hslMin,
        legend: hsl_path + 'components/legend/legend' + hslMin,
        lodexplorer: hsl_path + 'components/lodexplorer/lodexplorer' + hslMin,
        map: hsl_path + 'components/map/map' + hslMin,
        measure: hsl_path + 'components/measure/measure' + hslMin,
        mobile_toolbar: requirejs.s.contexts._.config.paths.mobile_toolbar || hsl_path + 'components/mobile_toolbar/mobile_toolbar',
        mobile_settings: requirejs.s.contexts._.config.paths.mobile_settings || hsl_path + 'components/mobile_settings/mobile_settings',
        ows: hsl_path + 'components/ows/ows' + hslMin,
        'ows.nonwms': hsl_path + 'components/ows/ows_nonwms' + hslMin,
        'ows.wfs': hsl_path + 'components/ows/ows_wfs' + hslMin,
        'ows.wms': hsl_path + 'components/ows/ows_wms' + hslMin,
        'ows.wmts': hsl_path + 'components/ows/ows_wmts' + hslMin,
        'ows.wmsprioritized': hsl_path + 'components/ows/ows_wmsprioritized' + hslMin,
        panoramio: hsl_path + 'components/layers/panoramio/panoramio' + hslMin,
        permalink: requirejs.s.contexts._.config.paths.permalink || hsl_path + 'components/permalink/permalink' + hslMin,
        print: hsl_path + 'components/print/print' + hslMin,
        query: hsl_path + 'components/query/query' + hslMin,
        sidebar: requirejs.s.contexts._.config.paths.sidebar || hsl_path + 'components/sidebar/sidebar' + hslMin,
        search: hsl_path + 'components/search/search' + hslMin,
        SparqlJson: requirejs.s.contexts._.config.paths.SparqlJson || hsl_path + 'components/layers/hs.source.SparqlJson' + hslMin,
        status_creator: hsl_path + 'components/status_creator/status_creator' + hslMin,
        styles: hsl_path + 'components/styles/styles' + hslMin,
        toolbar: requirejs.s.contexts._.config.paths.toolbar || hsl_path + 'components/toolbar/toolbar' + hslMin,
        translations: requirejs.s.contexts._.config.paths.translations || hsl_path + 'components/translations/js/translations',
        utils: hsl_path + 'components/utils' + hslMin,
        WFSCapabilities: requirejs.s.contexts._.config.paths.WFSCapabilities || hsl_path + 'components/format/hs.format.WFSCapabilities' + hslMin,
        olPopup: requirejs.s.contexts._.config.paths.olPopup || hsl_path + 'components/format/ol.popup' + hslMin,
        WfsSource: requirejs.s.contexts._.config.paths.WfsSource || hsl_path + 'components/layers/hs.source.Wfs' + hslMin,
        routing: hsl_path + 'components/routing/routing' + hslMin,
        tracking: hsl_path + 'components/tracking/tracking' + hslMin,
        s4a: requirejs.s.contexts._.config.paths.s4a || hsl_path + 'bower_components/s4a-js/dist/s4a.min',
        'dragdroplists': hsl_path + 'bower_components/angular-drag-and-drop-lists/angular-drag-and-drop-lists' + hslMin,
        'ngfocusif': hsl_path + 'bower_components/ng-focus-if/focusIf' + hslMin,
        'updateMeta': hsl_path + 'bower_components/angular-update-meta/dist/update-meta' + hslMin,
        socketio: hsl_path + 'bower_components/socket.io-client/socket.io' + hslMin,
        rtserver: requirejs.s.contexts._.config.paths.rtserver || hsl_path + 'components/rtserver/rtserver' + hslMin,
        config_parsers: hsl_path + 'components/compositions/config_parsers' + hslMin
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
            .service("Core", ['$rootScope', '$controller', '$window', 'hs.map.service', 'gettextCatalog', 'config', '$templateCache', '$timeout',
                function($rootScope, $controller, $window, OlMap, gettextCatalog, config, $templateCache, $timeout) {
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
                        /**
                        * @ngdoc property
                        * @name Core#puremapApp
                        * @public
                        * @type {Boolean} false 
                        * @description If app is running in puremapApp mode
                        */
                        puremapApp: false,
                        language: 'en',
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
                        * @params {Object} options Optional options object when HS app has not CSS sizes declared. Parent property is Boolean type when size should be taken from HS element parent. Element property is string for any Jquery selector (usage of element id is recommended e.g. "#container")
                        * @description Initialization function for HS layers elements and their sizes. Stores element and container references and sets event listeners for map resizing.
                        */
                        init: function(element, options) {
                            if (angular.isUndefined(options)) options = {};
                            if (angular.isDefined(options.windowedMap)) me.sizeOptions.windowedMap = options.windowedMap;
                            me.sizeOptions.element = element;
                            if (angular.isDefined(options.innerElement)) 
                                me.sizeOptions.innerElement = $(options.innerElement);
                            
                            if (angular.isDefined(options.parent)) {
                                me.sizeOptions.selector = element.parent();
                                me.initSizeListeners();
                                me.updateElementSize();
                            }
                            else if (angular.isDefined(options.element)) {
                                me.sizeOptions.selector = $(options.element);
                                me.initSizeListeners();
                                me.updateElementSize();
                            }
                            else {
                                me.initSizeListeners();
                                me.updateMapSize();
                            }
                        },
                        /**
                        * @ngdoc method
                        * @name Core#setSizeByContainer 
                        * @public
                        * @params {String|Boolean} container New container for size referencing (options - string Jquery selector - see Init function, Boolean 'true' value for parent of HS element)
                        * @description Change container for HS element.
                        */
                        setSizeByContainer: function(container) {
                            if (container == true) me.sizeOptions.selector = me.sizeOptions.element.parent();
                            else me.sizeOptions.selector = $(options.element);
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
                        setSizeByCSS: function(height, width) {
                            if (angular.isDefined(me.sizeOptions.selector)) me.sizeOptions.selector = undefined;
                            var element = me.sizeOptions.element;
                            element.height(height);
                            element.width(width);
                            me.updateMapSize();
                        },
                        /**
                        * @ngdoc method
                        * @name Core#initSizeListeners
                        * @public
                        * @description Add event listeners for updating HS element and map size after browser resizing or complete load of application. 
                        */
                        initSizeListeners: function() {
                            var w = angular.element($window);
                            w.resize(function(){
                                //$timeout(function(){
                                //    me.sizeOptions.selector == undefined ? me.updateMapSize() : me.updateElementSize();
                                //},100);//Hack, height of container was changed badly for no aparent reason
                                me.sizeOptions.selector == undefined ? me.updateMapSize() : me.updateElementSize();
                            });
                            $rootScope.$on("Core_sizeChanged",function(){
                                me.sizeOptions.selector == undefined ? me.updateMapSize() : me.updateElementSize();
                            });
                            $(function() { //onload checker for cases when bootstrap css change box-sizing property
                                me.sizeOptions.selector == undefined ? me.updateMapSize() : me.updateElementSize();
                            });
                        },
                        /**
                        * @ngdoc method
                        * @name Core#updateElementSize
                        * @public
                        * @description Update HS element size by its container sizes.
                        */
                        updateElementSize: function() {
                            var element = me.sizeOptions.element;
                            var container = me.sizeOptions.selector;
                            element.height(container.height());
                            element.width(container.width());
                            me.updateMapSize();
                        },
                        /**
                        * @ngdoc method
                        * @name Core#updateMapSize
                        * @public
                        * @description Update map size.
                        */
                        updateMapSize: function() {
                            var container = angular.isDefined(me.sizeOptions.innerElement) ? me.sizeOptions.innerElement : me.sizeOptions.element;
                            var map = $("#map");
                            var sidebarElem = $('.panelspace');
                            map.height(container.height());
                            $("#cesiumContainer").height(map.height());
                            if (me.puremapApp) {
                                map.width(container.width());
                            }
                            else if (container.width() > sidebarElem.outerWidth() || sidebarElem.length === 0) {
                                map.width(container.width() - sidebarElem.outerWidth());
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
                        * @name Core#fullScreenMap 
                        * @public
                        * @params {Object} element HS layers element gained from directive link
                        * @description Helper function for single page HS map applications. Not reccomended, used only for compability reasons and might be removed.
                        */
                        fullScreenMap: function(element) {
                            $("html").css('overflow', 'hidden');
                            $("html").css('height', '100%');
                            $('body').css('height', '100%');
                            me.sizeOptions.element = element;
                            me.sizeOptions.selector = element.parent();
                            me.initSizeListeners();
                            me.updateElementSize();
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
                            me.language = lang;
                        },
                        /**
                        * @ngdoc method
                        * @name Core#openStatusCreator 
                        * @public
                        * @description Open status creator panel
                        */
                        openStatusCreator: function() {
                            $rootScope.$broadcast('StatusCreator.open');
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
                            if(!angular.isDefined(window.getLRUser) && angular.isUndefined(me.missingLRFunctionsWarned)){
                                if(console) console.warn('window.getLRUser function needs to be defined, which usually comes from liferay.');
                                me.missingLRFunctionsWarned = true;
                            } 
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
 
                    return me;
                },

            ]);
    })
