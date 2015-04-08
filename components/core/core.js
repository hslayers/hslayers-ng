define(['angular'],

    function(angular) {
        angular.module('hs.core', ['hs.map', 'gettext'])
            .service("Core", ['$rootScope', '$controller', '$window', 'OlMap', 'gettextCatalog',
                function($rootScope, $controller, $window, OlMap, gettextCatalog) {
                    var me = {
                        scopes_registered: [],
                        mainpanel: "",
                        setMainPanel: function(which, by_gui) {
                            if (which == me.mainpanel && by_gui) which = "";
                            me.mainpanel = which;
                            if (!$rootScope.$$phase) $rootScope.$digest();
                            $rootScope.$broadcast('core.mainpanel_changed'); //Not used now, but could be useful
                        },
                        panelVisible: function(which, scope) {
                            if(typeof scope.panel_name == 'undefined') scope.panel_name = which;
                            return me.mainpanel == which || scope.unpinned;
                        },
                        hidePanels: function() {
                            me.mainpanel = '';
                            if (!$rootScope.$$phase) $rootScope.$digest();
                            $rootScope.$broadcast('core.mainpanel_changed'); //Not used now, but could be useful
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
                            if(which.panel_name == me.mainpanel) me.mainpanel = '';
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
                        fullscreenMap: function(element) {
                            var w = angular.element($window);
                            w.bind('resize', function() {
                                $("html").css('overflow', 'hidden');
                                element[0].style.height = w.height() + "px";
                                element[0].style.width = w.width() + "px";
                                $("#map").height(w.height());
                                $("#map").width(w.width());
                                OlMap.map.updateSize();
                            });
                            w.resize();
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
                        }
                    };

                    return me;
                },

            ]);

    })
