/**
 * @namespace hs.sidebar
 * @memberOf hs
 */
define(['angular', 'map', 'core', 'permalink', 'ngcookies'],

    function(angular) {
        angular.module('hs.sidebar', ['hs.map', 'hs.core', 'ngCookies'])
            .directive('hs.sidebar.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/sidebar/partials/sidebar.html'
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

                $scope.collapsed = function(is) {
                    if (arguments.length > 0) {
                        collapsed = is;
                    }
                    return collapsed;
                }

                $scope.toggle = function() {
                    if ($(document).width() < 800) {
                        return "mobile";
                    } else {
                        return "";
                    }
                }

                $scope.toggleSidebar = function() {
                    $scope.toggle = !$scope.toggle;
                    $cookies.put('toggle', $scope.toggle);
                };

                $scope.$emit('scope_loaded', "Sidebar");
            }

        ]);
    })
