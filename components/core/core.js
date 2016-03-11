/**
 * @namespace hs
 */

/**
 * @namespace hs.core
 * @memberOf hs
 */
require.config({
    paths: {
        angular: hsl_path + 'bower_components/angular/angular',
        ngcookies: hsl_path + 'bower_components/angular-cookies/angular-cookies',
        bootstrap: hsl_path + 'bower_components/bootstrap/dist/js/bootstrap',
        ol: requirejs.s.contexts._.config.paths.ol || hsl_path + 'node_modules/openlayers/dist/ol',
        drag: hsl_path + 'components/drag/drag',
        map: hsl_path + 'components/map/map',
        styles: hsl_path + 'components/styles/styles',
        'angular-sanitize': hsl_path + 'bower_components/angular-sanitize/angular-sanitize',
        'angular-gettext': hsl_path + 'bower_components/angular-gettext/dist/angular-gettext',
        compositions: hsl_path + 'components/compositions/compositions',
        permalink: requirejs.s.contexts._.config.paths.permalink || hsl_path + 'components/permalink/permalink',
        utils: hsl_path + 'components/utils',
        status_creator: hsl_path + 'components/status_creator/status_creator',
        xml2json: requirejs.s.contexts._.config.paths.xml2json || hsl_path + 'bower_components/xml2json/xml2json.min',
        customhtml: requirejs.s.contexts._.config.paths.customhtml || hsl_path + 'components/customhtml/customhtml',
        d3: requirejs.s.contexts._.config.paths.d3 || hsl_path + 'bower_components/d3/d3.min',
        proj4: requirejs.s.contexts._.config.paths.proj4 || hsl_path + 'bower_components/proj4/dist/proj4',
        crossfilter: requirejs.s.contexts._.config.paths.crossfilter || hsl_path + 'bower_components/crossfilter/crossfilter.min',
        Jsonix: requirejs.s.contexts._.config.paths.Jsonix || hsl_path + 'bower_components/jsonix/dist/Jsonix-all',
        WFS_2_0: requirejs.s.contexts._.config.paths.WFS_2_0 || hsl_path + 'bower_components/ogc-schemas/scripts/lib/WFS_2_0',
        GML_3_2_1: requirejs.s.contexts._.config.paths.GML_3_2_1 || hsl_path + 'bower_components/ogc-schemas/scripts/lib/GML_3_2_1',
        OWS_1_1_0: requirejs.s.contexts._.config.paths.OWS_1_1_0 || hsl_path + 'bower_components/ogc-schemas/scripts/lib/OWS_1_1_0',
        Filter_2_0: requirejs.s.contexts._.config.paths.Filter_2_0 || hsl_path + 'bower_components/ogc-schemas/scripts/lib/Filter_2_0',
        XSD_1_0: requirejs.s.contexts._.config.paths.XSD_1_0 || hsl_path + 'bower_components/w3c-schemas/scripts/lib/XSD_1_0',
        XLink_1_0: requirejs.s.contexts._.config.paths.XLink_1_0 || hsl_path + 'bower_components/w3c-schemas/scripts/lib/XLink_1_0',
        dc: requirejs.s.contexts._.config.paths.dc || '//cdnjs.cloudflare.com/ajax/libs/dc/1.7.0/dc',
        api: requirejs.s.contexts._.config.paths.api || hsl_path + 'components/api/api',
        translations: requirejs.s.contexts._.config.paths.translations || hsl_path + 'components/translations/js/translations',
        sidebar: requirejs.s.contexts._.config.paths.sidebar || hsl_path + 'components/sidebar/sidebar',
        geojson: requirejs.s.contexts._.config.paths.geojson || hsl_path + 'components/layers/hs.source.GeoJSON',
        mobile_toolbar: requirejs.s.contexts._.config.paths.mobile_toolbar || hsl_path + 'components/mobile_toolbar/mobile_toolbar',
        SparqlJson: requirejs.s.contexts._.config.paths.SparqlJson || hsl_path + 'components/layers/hs.source.SparqlJson',
    },
    shim: {
        'angular': {
            'exports': 'angular'
        },
        'angular-sanitize': {
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
            .service("Core", ['$rootScope', '$controller', '$window', 'hs.map.service', 'gettextCatalog', 'config', '$templateCache',
                function($rootScope, $controller, $window, OlMap, gettextCatalog, config, $templateCache) {
                    var me = {
                        config: config,
                        scopes_registered: [],
                        mainpanel: "",
                        defaultPanel: "",
                        sidebarExpanded: false,
                        sidebarRight: true,
                        sidebarLabels: true,
                        sidebarToggleable: true,
                        sidebarButtons: true,
                        singleDatasources: false,
                        embededEnabled: true,
                        panel_statuses: {},
                        _exist_cache: {},
                        setMainPanel: function(which, by_gui) {
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
                            if (!$rootScope.$$phase) $rootScope.$digest();
                            $rootScope.$broadcast('core.mainpanel_changed');
                        },
                        setDefaultPanel: function(which) {
                            me.defaultPanel = which;
                            me.setMainPanel(which);
                        },
                        updateMapSize: function(open) {
                            var w = angular.element($window);
                            var map = $("#map");
                            var sidebarElem = $('.panelspace');
                            if (w.width() != sidebarElem.width()) {
                                map.width(w.width() - sidebarElem.width());
                            } else {
                                map.width(w.width());
                            }
                            OlMap.map.updateSize();
                        },

                        panelVisible: function(which, scope) {
                            if (angular.isDefined(scope))
                                if (angular.isUndefined(scope.panel_name)) scope.panel_name = which;
                            if (angular.isDefined(me.panel_statuses[which])) {
                                return me.panel_statuses[which];
                            }
                            return me.mainpanel == which || (angular.isDefined(scope) && scope.unpinned);
                        },
                        hidePanels: function() {
                            me.mainpanel = '';
                            me.sidebarLabels = true;
                            if (!me.exists('hs.sidebar.controller')) {
                                me.sidebarExpanded = false
                            }
                            if (!$rootScope.$$phase) $rootScope.$digest();
                            $rootScope.$broadcast('core.mainpanel_changed');
                        },
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

                            $rootScope.$broadcast('core.mainpanel_changed');
                        },
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
                        fullScreenMap: function(element) {
                            var w = angular.element($window);
                            w.bind('resize', function() {
                                $("html").css('overflow', 'hidden');
                                $("html").css('height', '100%');
                                $('body').css('height', '100%');
                                element[0].style.height = w.height() + "px";
                                element[0].style.width = w.width() + "px";
                                $("#map").height(w.height());
                                me.updateMapSize();
                                OlMap.map.updateSize();
                            });
                            w.resize();
                        },
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
                        getAllScopes: function() {
                            var getScopes = function(root) {
                                var scopes = [];

                                function visit(scope) {
                                    scopes.push(scope);
                                }

                                function traverse(scope) {
                                    visit(scope);
                                    if (scope.$$nextSibling)
                                        traverse(scope.$$nextSibling);
                                    if (scope.$$childHead)
                                        traverse(scope.$$childHead);
                                }

                                traverse(root);
                                return scopes;
                            }
                            return getScopes($rootScope);
                        },
                        openStatusCreator: function() {
                            //me.panel_statuses.status_creator = true;
                            hslayers_api.gui.StatusCreator.open();
                        },
                        searchVisible: function(is) {
                            if (arguments.length > 0) {
                                me.panel_statuses['search'] = is;
                            }
                            return me.panel_statuses['search']
                        },
                        isAuthorized: function() {
                            if (angular.isDefined(window.getLRUser) && window.getLRUser() != 'guest') {
                                return true;
                            }
                            return false;
                        },
                        resetMap: function() {
                            OlMap.reset();
                            $rootScope.$broadcast('core.map_reset', {});
                        },
                        isMobile: function() {
                            if (screen.width < 800) {
                                return "mobile";
                            } else {
                                return "";
                            }
                        }
                    };

                    $templateCache.removeAll();

                    if (me.exists('hs.sidebar.controller')) {
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
