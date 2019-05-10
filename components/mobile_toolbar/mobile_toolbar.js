/**
 * @namespace hs.mobile_toolbar
 * @memberOf hs
 */
define(['angular', 'map', 'core', 'permalink'],

    function(angular) {
        angular.module('hs.mobile_toolbar', ['hs.map', 'hs.core'])
            /**
            * @memberof hs.mobile_toolbar
            * @ngdoc service
            * @name hs.mobile_toolbar.service
            * @description TODO
            */
            .service('hs.mobile_toolbar.service', ['Core',
                function(Core) {
                    /**
                    * @function togglePanelspace
                    * @memberOf hs.mobile_toolbar.service
                    * @params {} to_state
                    * @description (PRIVATE) TODO
                    */
                    function togglePanelspace(to_state) {
                        if (angular.isDefined(to_state)) {
                            me.panelspace0pened = to_state;
                        } else {
                            me.panelspace0pened = !me.panelspace0pened;
                        }
                        Core.sidebarExpanded = me.panelspace0pened;
                        if ($(".menu-switch.btn-mobile .icon-menu-hamburger")[0]) {
                            $(".menu-switch.btn-mobile .icon-menu-hamburger").removeClass("icon-menu-hamburger");
                            $(".menu-switch.btn-mobile .menu-icon").addClass(Core.sidebarRight ? "icon-menu-right" : "icon-menu-left");
                        } else {
                            $(".menu-switch.btn-mobile .menu-icon").removeClass(Core.sidebarRight ? "icon-menu-right" : "icon-menu-left");
                            $(".menu-switch.btn-mobile .menu-icon").addClass("icon-menu-hamburger");
                        }
                        $(".panelspace, #toolbar, #map, #menu").toggleClass("panelspace-opened", me.panelspace0pened);
                    }

                    var me = {
                        panelspace0pened: false,
                        togglePanelspace: togglePanelspace
                    };
                    return me;
                }
            ])
            /**
            * @memberof hs.mobile_toolbar
            * @ngdoc directive
            * @name hs.mobile_toolbar.directive
            * @description TODO
            */
            .directive('hs.mobileToolbar.directive', ['config', function (config) {
                return {
                    template: require('components/mobile_toolbar/partials/mobile_toolbar.html')
                };
            }])

        /**
        * @memberof hs.mobile_toolbar
        * @ngdoc controller
        * @name hs.mobile_toolbar.controller
        * @description TODO
        */
        .controller('hs.mobile_toolbar.controller', ['$scope', '$timeout', 'hs.mobile_toolbar.service', 'Core', '$window',
            function($scope, $timeout, service, Core, $window) {
                $scope.Core = Core;
                $scope.Core.sidebarRight = false;
                $scope.Core.sidebarExpanded = service.panelspace0pened;
                $scope.service = service;

                /**
                 * @function setMainPanel
                 * @memberOf hs.mobile_toolbar.controller
                 * @params {} which
                 * @description TODO
                 */
                $scope.setMainPanel = function(which) {
                    $timeout(function() { Core.setMainPanel(which, false); })
                }

                $scope.togglePanelspace = service.togglePanelspace;
                togglePanelspace = service.togglePanelspace;
                $scope.$emit('scope_loaded', "Mobile Toolbar");
            }

        ]);
    })
