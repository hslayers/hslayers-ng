define(['angular', 'map'],

    function(angular) {
        angular.module('hs.toolbar', ['hs.map'])
            .directive('toolbar', function() {
                return {
                    templateUrl: hsl_path + 'components/toolbar/partials/toolbar.html'
                };
            }).service("ToolbarService", ['$rootScope',
                function($rootScope) {
                    var me = {
                        mainpanel: "",
                        setMainPanel: function(which) {
                            me.mainpanel = which;
                            $rootScope.$broadcast('toolbar.mainpanel_changed'); //Not used now, but could be useful
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
