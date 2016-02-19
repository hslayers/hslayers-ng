/**
 * @namespace hs.mobile_toolbar
 * @memberOf hs
 */
define(['angular', 'map', 'core', 'permalink'],

    function(angular) {
        angular.module('hs.mobile_toolbar', ['hs.map', 'hs.core'])
            .directive('hs.mobileToolbar.directive', function() {
                console.log("Outputting mobile toolbar!");
                return {
                    templateUrl: hsl_path + 'components/mobile_toolbar/partials/mobile_toolbar.html'
                };
            })

        .controller('hs.mobile_toolbar.controller', ['$scope', 'hs.map.service', 'Core', 'hs.permalink.service_url', '$window',
            function($scope, OlMap, Core, bus, $window) {
                $scope.Core = Core;
                var collapsed = false;

                // $scope.setMainPanel = function(which) {
                //     Core.setMainPanel(which, true);
                //     if (!$scope.$$phase) $scope.$digest();
                // }

                // if (bus.getParamValue('hs_panel')) {
                //     $scope.setMainPanel(bus.getParamValue('hs_panel'));
                // }

                $scope.collapsed = function(is) {
                    if (arguments.length > 0) {
                        collapsed = is;
                    }
                    return collapsed;
                }

                // $scope.isMobile = function() {
                //     if ($(document).width() < 800) {
                //         return "mobile";
                //     } else {
                //         return "";
                //     }
                // }

                $scope.$emit('scope_loaded', "Mobile Toolbar");
            }

        ]);
    })
