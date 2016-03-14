/**
 * @namespace hs.mobile_toolbar
 * @memberOf hs
 */
define(['angular', 'map', 'core', 'permalink'],

    function(angular) {
        angular.module('hs.mobile_toolbar', ['hs.map', 'hs.core'])
            .directive('hs.mobileToolbar.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/mobile_toolbar/partials/mobile_toolbar.html'
                };
            })

        .controller('hs.mobile_toolbar.controller', ['$scope', 'hs.map.service', 'Core', 'hs.permalink.service_url', '$window',
            function($scope, OlMap, Core, bus, $window) {
                $scope.Core = Core;
                $scope.panelspace0pened = false;
                $scope.Core.sidebarRight = false;
                $scope.Core.sidebarExpanded = $scope.panelspace0pened;

                $scope.setMainPanel = function(which) {
                    Core.setMainPanel(which, false);
                    if (!$scope.$$phase) $scope.$digest();
                }

                $scope.togglePanelspace = function() {
                    if (!$scope.panelspaceOpened) {
                        $scope.panelspaceOpened = true;
                        $scope.Core.sidebarExpanded = true;
                    } else {
                        $scope.panelspaceOpened = false;
                        $scope.Core.sidebarExpanded = false;
                    }
                    $(".panelspace").toggleClass("panelspace-opened");
                    $("#toolbar").toggleClass("panelspace-opened");
                    $("#map").toggleClass("panelspace-opened");
                    $("#menu").toggleClass("panelspace-opened");
                }

                $scope.$emit('scope_loaded', "Mobile Toolbar");
            }

        ]);
    })
