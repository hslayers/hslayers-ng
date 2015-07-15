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
        bootstrap: hsl_path + 'bower_components/bootstrap/dist/js/bootstrap',
        ol: requirejs.s.contexts._.config.paths.ol || hsl_path + 'lib/ol3/ol-full',
        drag: hsl_path + 'components/drag/drag',
        map: hsl_path + 'components/map/map',
        'angular-sanitize': hsl_path + 'bower_components/angular-sanitize/angular-sanitize',
        'angular-gettext': hsl_path + 'bower_components/angular-gettext/dist/angular-gettext',
        compositions: hsl_path + 'components/compositions/compositions',
        status_creator: hsl_path + 'components/status_creator/status_creator',
        xml2json: requirejs.s.contexts._.config.paths.xml2json || hsl_path + 'bower_components/xml2json/xml2json.min',
        d3: requirejs.s.contexts._.config.paths.d3 || hsl_path + 'bower_components/d3/d3.min',
        crossfilter: requirejs.s.contexts._.config.paths.crossfilter || hsl_path + 'bower_components/crossfilter/crossfilter.min',
        dc: requirejs.s.contexts._.config.paths.dc || 'http://cdnjs.buttflare.com/ajax/libs/dc/1.7.0/dc'
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
        translations: {
            deps: ['angular-gettext'],
        }
    },
    priority: [
        "angular"
    ]
});

define(['angular', 'angular-gettext', 'translations', 'ol', 'map', 'drag', 'bootstrap'],
    function(angular) {
        angular.module('hs.core', ['hs.map', 'gettext', 'gettext', 'hs.drag'])
            .service("Core", ['$rootScope', '$controller', '$window', 'hs.map.service', 'gettextCatalog',
                function($rootScope, $controller, $window, OlMap, gettextCatalog) {
                    var me = {
                        scopes_registered: [],
                        mainpanel: "",
                        panel_statuses: {},
                        setMainPanel: function(which, by_gui) {
                            if (which == me.mainpanel && by_gui) which = "";
                            me.mainpanel = which;
                            if (!$rootScope.$$phase) $rootScope.$digest();
                            $rootScope.$broadcast('core.mainpanel_changed');
                        },
                        panelVisible: function(which, scope) {
                            if (typeof scope !== 'undefined')
                                if (typeof scope.panel_name == 'undefined') scope.panel_name = which;
                            if (typeof me.panel_statuses[which] !== 'undefined') {
                                return me.panel_statuses[which];
                            }
                            return me.mainpanel == which || scope.unpinned;
                        },
                        hidePanels: function() {
                            me.mainpanel = '';
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
                            if (which.panel_name == me.mainpanel) me.mainpanel = '';
                            $rootScope.$broadcast('core.mainpanel_changed');
                        },
                        exists: function(controllerName) {
                            if (typeof window[controllerName] == 'function') {
                                return true;
                            }
                            try {
                                $controller(controllerName);
                                return true;
                            } catch (error) {
                                return !(error instanceof TypeError);
                            }
                        },
                        fullscreenMap: function(element, panel_side) {
                            var w = angular.element($window);
                            w.bind('resize', function() {
                                $("html").css('overflow', 'hidden');
                                element[0].style.height = w.height() + "px";
                                element[0].style.width = w.width() + "px";
                                $("#map").height(w.height());
                                $("#map").width(w.width());
                                OlMap.map.updateSize();
                            });
                            if(arguments.length>1){
                              me.setPanelSide(element, panel_side); 
                            }
                            w.resize();
                        },
                        setPanelSide: function(element, panel_side){
                            if(panel_side=='left'){
                                $('.panelspace', element).insertBefore($('.gui-overlay', element).children().get(0));
                                $('.panelspace', element).css({"margin-top": '44px'});
                                $('.gui-overlay', element).css({"margin-bottom": '44px'});
                            }
                            if(panel_side=='right'){
                                $('.panelspace', element).insertAfter($('.gui-overlay', element).children().get($('.gui-overlay', element).children().length-1));
                                $('#right-pane', element).insertBefore($('.gui-overlay', element).children().get(0));
                            }
                        },
                        setLanguage: function(lang) {
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
                            me.panel_statuses.status_creator = true;
                            hslayers_api.gui.StatusCreator.open();
                        }
                    };

                    return me;
                },

            ]);

    })
