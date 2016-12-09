/**
 * @namespace hs.sidebar
 * @memberOf hs
 */
define(['angular', 'map', 'core', 'permalink', 'ngcookies'],

    function(angular) {
        angular.module('hs.sidebar', ['hs.map', 'hs.core', 'ngCookies'])
            /**
            * @memberof hs.sidebar
            * @ngdoc directive
            * @name hs.sidebar.directive
            * @description Add sidebar template to app, listeners for sidebar width changes are embed in directive
            */
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
                                scope.$emit('sidebar_change', scope.Core.sidebarExpanded);
                            }, true
                        )
                    }
                };
            }])

        /**
        * @memberof hs.sidebar
        * @ngdoc controller
        * @name hs.sidebar.controller
        */
        .controller('hs.sidebar.controller', ['$scope', 'hs.map.service', 'Core', 'hs.permalink.service_url', '$window', '$cookies',
            function($scope, OlMap, Core, bus, $window, $cookies) {
                $scope.Core = Core;
                /**
                 * Set current active panel in sidebar
                 * @memberof hs.sidebar.controller
                 * @function setMainPanel
                 * @param {string} which Name of panel to set active
                 * @param {boolean} queryable 
                 */
                $scope.setMainPanel = function(which, queryable) {
                    Core.setMainPanel(which, true, queryable);
                    if (!$scope.$$phase) $scope.$digest();
                }

                if (bus.getParamValue('hs_panel')) {
                    $scope.setMainPanel(bus.getParamValue('hs_panel'));
                }

                /**
                 * Toggle sidebar mode between expanded and narrow
                 * @memberof hs.sidebar.controller
                 * @function toggleSidebar
                 */
                $scope.toggleSidebar = function() {
                    $scope.Core.sidebarExpanded = !$scope.Core.sidebarExpanded;
                };

                $scope.$emit('scope_loaded', "Sidebar");
            }

        ]);
    })
