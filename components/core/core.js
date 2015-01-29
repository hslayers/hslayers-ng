define(['angular'],

    function(angular) {
        angular.module('hs.core', [])
          .service("Core", ['$rootScope', '$controller',
                function($rootScope, $controller) {
                    var me = {
                        mainpanel: "",
                        setMainPanel: function(which, by_gui) {
                            if (which == me.mainpanel && by_gui) which = "";
                            me.mainpanel = which;
                            $rootScope.$broadcast('core.mainpanel_changed'); //Not used now, but could be useful
                        },
                        hidePanels: function() {
                            me.mainpanel = '';
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
                        }
                    };

                    return me;
                }
            ]) 
    })
