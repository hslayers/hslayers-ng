/**
 * @namespace hs.layout
 * @memberOf hs
 */
define(['angular', 'core'],

    function(angular) {
        angular.module('hs.layout', ['hs.core'])
            /**
            * @memberof hs.mdSidenav
            * @ngdoc directive
            * @name hs.mdSidenav.directive
            * @description TODO
            */
            .directive('hs.mdSidenav.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/layout/partials/sidenav.html?bust=' + gitsha
                };
            })

            /**
            * @memberof hs.mdToolbar
            * @ngdoc directive
            * @name hs.mdToolbar.directive
            * @description TODO
            */
            .directive('hs.mdToolbar.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/layout/partials/toolbar.html?bust=' + gitsha
                };
            })

        /**
        * @memberof hs.layout
        * @ngdoc controller
        * @name hs.layout.controller
        * @description TODO
        */
        .controller('hs.layout.controller', ['$scope', '$window', 'Core', 'hs.map.service', 'gettextCatalog', 'config', '$templateCache', '$timeout', '$interval', '$mdSidenav',
            function($scope, $window, Core, OlMap, gettextCatalog, config, $templateCache, $timeout, $interval, $mdSidenav) {
                $scope.Core = Core;
                $scope.$on('scope_loaded', function() {
                    $("#loading-logo").remove();
                });

                $scope.toggleLeftSidenav = function() {
                    $mdSidenav('sidenav-left').toggle();
                    console.log("Sidenav toggled.");
                }

                $scope.$emit('scope_loaded', "Layout");
            }

        ]);
    })
