/**
 * @namespace hs.sidebar
 * @memberOf hs
 */
define(['angular', 'map', 'core', 'permalink', 'ngcookies'],

    function(angular) {
        angular.module('hs.sidebar', ['hs.map', 'hs.core', 'ngCookies'])
            .directive('hs.sidebar.directive', ['$compile', function($compile) {
                return {
                    templateUrl: hsl_path + 'components/sidebar/partials/sidebar.html?bust=' + gitsha,
                    link: function(scope, element, attrs) {
                        if (angular.isDefined(scope.Core.config.createExtraMenu))
                            scope.Core.config.createExtraMenu($compile, scope, element);
                        scope.$watch(
                            function() {
                                return [scope.Core.sidebarExpanded, angular.element('.panelspace').width()]
                            },
                            function(value) {
                                setTimeout(function() {
                                    scope.Core.updateMapSize();
                                }, 0)
                            }, true
                        )
                    }
                };
            }])

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
                };

                $scope.$emit('scope_loaded', "Sidebar");
            }

        ]);
    })
