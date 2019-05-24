/**
 * @namespace hs.sidebar
 * @memberOf hs
 */
define(['angular', 'map', 'core', 'permalink', 'angular-cookies'],

    function(angular) {
        angular.module('hs.sidebar', ['hs.map', 'hs.core', 'ngCookies'])
             .service('hs.sidebar.service', ['config', '$rootScope', 'hs.utils.service', function(config, $rootScope, utils) {
                this.extra_buttons = [];
                
                var me = this;

            }])
             
            /**
             * @memberof hs.sidebar
             * @ngdoc directive
             * @name hs.sidebar.directive
             * @description Add sidebar template to app, listeners for sidebar width changes are embed in directive
             */
            .directive('hs.sidebar.directive', ['$compile', 'config', function($compile, config) {
                return {
                    template: require('components/sidebar/partials/sidebar.html'),
                    link: function(scope, element, attrs) {
                        if (angular.isDefined(scope.Core.config.createExtraMenu))
                            scope.Core.config.createExtraMenu($compile, scope, element);
                        scope.$watch(
                            function() {
                                var panels = document.getElementsByClassName('panelspace');
                                var panelSpaceWidth = panels.length > 0 ? panels[0].clientWidth : 0;
                                return [scope.Core.sidebarExpanded, panelSpaceWidth]
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
             * @ngdoc directive
             * @name hs.sidebar.directive
             * @description Add sidebar template to app, listeners for sidebar width changes are embed in directive
             */
            .directive('hs.minisidebar.directive', ['$compile', 'config', function($compile, config) {
                return {
                    template: require('components/sidebar/partials/minisidebar.html'),
                    link: function(scope, element, attrs) {
                        if (angular.isDefined(scope.Core.config.createExtraMenu))
                            scope.Core.config.createExtraMenu($compile, scope, element);
                        scope.$watch(
                            function() {
                                return [scope.Core.sidebarExpanded, document.getElementsByClassName('panelspace')[0].innerWidth]
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
        .controller('hs.sidebar.controller', ['$scope', '$timeout', 'hs.map.service', 'Core', 'hs.permalink.urlService', '$window', '$cookies', 'hs.sidebar.service',
            function($scope, $timeout, OlMap, Core, bus, $window, $cookies, service) {
                $scope.Core = Core;
                /**
                 * Set current active panel in sidebar
                 * @memberof hs.sidebar.controller
                 * @function setMainPanel
                 * @param {string} which Name of panel to set active
                 * @param {boolean} queryable 
                 */
                $scope.setMainPanel = function(which, queryable) {
                    $timeout(function() { Core.setMainPanel(which, true, queryable); })
                }

                if (bus.getParamValue('hs_panel')) {
                    $scope.setMainPanel(bus.getParamValue('hs_panel'));
                }
                
                $scope.service = service;

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
