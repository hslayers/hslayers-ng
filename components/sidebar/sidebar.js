/**
 * @namespace hs.sidebar
 * @memberOf hs
 */
define(['angular', 'map', 'core', 'permalink', 'ngcookies'],

    function(angular) {
        angular.module('hs.sidebar', ['hs.map', 'hs.core', 'ngCookies'])
            .directive('hs.sidebar.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/sidebar/partials/sidebar.html',
                    link: function(scope, element, attrs) {
                        scope.$watch(
                            function () { return angular.element('.panelspace').width()},
                            function (value) {
                                scope.Core.updateMapSize();
                            }
                        )
                    }
                };
            })

        .controller('hs.sidebar.controller', ['$scope', 'hs.map.service', 'Core', 'hs.permalink.service_url', '$window', '$cookies',
            function($scope, OlMap, Core, bus, $window, $cookies) {
                $scope.Core = Core;
                $scope.setMainPanel = function(which) {
                    Core.setMainPanel(which, true);
                    if (!$scope.$$phase) $scope.$digest();
                }

                if (bus.getParamValue('hs_panel')) {
                    $scope.setMainPanel(bus.getParamValue('hs_panel'));
                }

                $scope.toggleSidebar = function() {
                    $scope.Core.sidebarExpanded = !$scope.Core.sidebarExpanded;
                    $scope.Core.updateMapSize();
                    $cookies.put('sidebarExpanded', $scope.Core.sidebarExpanded);
                };

                $scope.$emit('scope_loaded', "Sidebar");
            }

        ]);
    })
