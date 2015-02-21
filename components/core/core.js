define(['angular'],

    function(angular) {
        angular.module('hs.core', ['hs.map'])
            .service("Core", ['$rootScope', '$controller', '$window', 'OlMap',
                function($rootScope, $controller, $window, OlMap) {
                    var me = {
                        scopes_registered: [],
                        mainpanel: "",
                        setMainPanel: function(which, by_gui) {
                            if (which == me.mainpanel && by_gui) which = "";
                            me.mainpanel = which;
                            if (!$rootScope.$$phase) $rootScope.$digest();
                            $rootScope.$broadcast('core.mainpanel_changed'); //Not used now, but could be useful
                        },
                        hidePanels: function() {
                            me.mainpanel = '';
                            if (!$rootScope.$$phase) $rootScope.$digest();
                            $rootScope.$broadcast('core.mainpanel_changed'); //Not used now, but could be useful
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
                            setTimeout(function() {
                                var w = angular.element($window);
                                w.bind('resize', function() {
                                    $("html").css('overflow', 'hidden');
                                    element[0].style.height = w.height() + "px";
                                    element[0].style.width = w.width() + "px";
                                    $("#map").height(w.height());
                                    console.log(w.height());
                                    $("#map").width(w.width());
                                    OlMap.map.updateSize()
                                });
                                w.resize();
                            }, 500);
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
                }
            ])
    })
