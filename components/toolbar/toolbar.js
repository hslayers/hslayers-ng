/**
 * @namespace hs.toolbar
 * @memberOf hs
 */
define(['angular', 'map', 'core', 'permalink'],

    function(angular) {
        angular.module('hs.toolbar', ['hs.map', 'hs.core'])
            /**
             * @memberof hs.toolbar
             * @ngdoc directive
             * @name hs.toolbar.directive
             * @description Add toolbar to map (search field, full map button a measure button)
             */
            .directive('hs.toolbar.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/toolbar/partials/toolbar.html?bust=' + gitsha
                };
            })

        /**
         * @memberof hs.toolbar
         * @ngdoc controller
         * @name hs.toolbar.controller
         */
        .controller('hs.toolbar.controller', ['$scope', 'hs.map.service', 'Core', 'hs.permalink.service_url', '$window',
            function($scope, OlMap, Core, bus, $window) {
                $scope.Core = Core;
                var collapsed = false;

                /**
                 * Set current active panel in sidebar
                 * @memberof hs.toolbar.controller
                 * @function setMainPanel
                 * @param {string} which
                 */
                $scope.setMainPanel = function(which) {
                    Core.setMainPanel(which, true);
                    if (!$scope.$$phase) $scope.$digest();
                }

                /**
                 * Change collapsed setting
                 * @memberof hs.toolbar.controller
                 * @function collapsed
                 * @param {boolean} is
                 */
                $scope.collapsed = function(is) {
                    if (arguments.length > 0) {
                        collapsed = is;
                    }
                    return collapsed;
                }

                /**
                 * Test mobile mode (document width under 800px)
                 * @memberof hs.toolbar.controller
                 * @function isMobile
                 */
                $scope.isMobile = function() {
                    if ($(document).width() < 800) {
                        return "mobile";
                    } else {
                        return "";
                    }
                }

                $scope.$on('core.map_reset', function(event) {
                    delete $scope.composition_title;
                    delete $scope.composition_abstract;
                    if (!$scope.$$phase) $scope.$digest();
                });

                $scope.compositionLoaded = function() {
                    return angular.isDefined($scope.composition_title);
                }

                $scope.$emit('scope_loaded', "Toolbar");
            }

        ]);
    })
