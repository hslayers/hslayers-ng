define(['angular', 'map', 'core', 'permalink'],

    function(angular) {
        angular.module('hs.toolbar', ['hs.map', 'hs.core'])
            .directive('toolbar', function() {
                return {
                    templateUrl: hsl_path + 'components/toolbar/partials/toolbar.html'
                };
            })

        .controller('Toolbar', ['$scope', 'OlMap', 'Core', 'BrowserUrlService',
            function($scope, OlMap, Core, bus) {
                $scope.Core = Core;
                $scope.setMainPanel = function(which) {
                    Core.setMainPanel(which, true);
                }
                if (bus.getParamValue('hs_panel')) {
                    $scope.setMainPanel(bus.getParamValue('hs_panel'));
                }
            }
           
        ]);
    })
