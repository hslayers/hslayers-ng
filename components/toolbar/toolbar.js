/**
 * @namespace hs.toolbar
 * @memberOf hs
 */
define(['angular', 'map', 'core', 'permalink'],

    function(angular) {
        angular.module('hs.toolbar', ['hs.map', 'hs.core'])
            .directive('hs.toolbar.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/toolbar/partials/toolbar.html'
                };
            })

        .controller('hs.toolbar.controller', ['$scope', 'hs.map.service', 'Core', 'hs.permalink.service_url', '$window',
            function($scope, OlMap, Core, bus, $window) {
                $scope.Core = Core;
                var collapsed = false;

                $scope.setMainPanel = function(which) {
                    Core.setMainPanel(which, true);
                    if (!$scope.$$phase) $scope.$digest();
                }

                $scope.collapsed = function(is) {
                    if (arguments.length > 0) {
                        collapsed = is;
                    }
                    return collapsed;
                }

                $scope.isMobile = function() {
                    if ($(document).width() < 800) {
                        return "mobile";
                    } else {
                        return "";
                    }
                }

                $scope.$emit('scope_loaded', "Toolbar");
            }

        ]);
    })
