define(['angular', 'map'],

    function(angular) {
        angular.module('hs.toolbar', ['hs.map'])
            .directive('toolbar', function() {
                return {
                    templateUrl: hsl_path + 'components/toolbar/partials/toolbar.html'
                };
            }).service("ToolbarService", ['$rootScope', '$controller',
                function($rootScope, $controller) {
                    var me = {
                        mainpanel: "",
                        setMainPanel: function(which, by_gui) {
                            if (which == me.mainpanel && by_gui) which = "";
                            me.mainpanel = which;
                            $rootScope.$broadcast('toolbar.mainpanel_changed'); //Not used now, but could be useful
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

        .controller('Toolbar', ['$scope', 'OlMap',
            function($scope, OlMap) {

            }
        ]);
    })
