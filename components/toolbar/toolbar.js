define(['angular', 'map', 'core'],

    function(angular) {
        angular.module('hs.toolbar', ['hs.map', 'hs.core'])
            .directive('toolbar', function() {
                return {
                    templateUrl: hsl_path + 'components/toolbar/partials/toolbar.html'
                };
            })

        .controller('Toolbar', ['$scope', 'OlMap', 'Core',
            function($scope, OlMap, Core) {
                $scope.Core = Core;
                $scope.setMainPanel = function (which){
                       Core.setMainPanel(which, true);
                }
            }
        ]);
    })
