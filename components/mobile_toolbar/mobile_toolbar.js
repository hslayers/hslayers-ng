/**
 * @namespace hs.mobile_toolbar
 * @memberOf hs
 */
define(['angular', 'map', 'core', 'permalink'],

    function(angular) {
        angular.module('hs.mobile_toolbar', ['hs.map', 'hs.core'])
            .directive('hs.mobileToolbar.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/mobile_toolbar/partials/mobile_toolbar.html?bust=' + gitsha
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
                    $scope.panelspace0pened = !$scope.panelspace0pened;
                    $scope.Core.sidebarExpanded = $scope.panelspace0pened;
                    if ($(".menu-switch.btn-mobile .glyphicon-menu-hamburger")[0]) {
                        $(".menu-switch.btn-mobile .glyphicon-menu-hamburger").removeClass("glyphicon-menu-hamburger");
                        $(".menu-switch.btn-mobile .menu-icon").addClass($scope.Core.sidebarRight ? "glyphicon-menu-right" : "glyphicon-menu-left");
                    } else {
                        $(".menu-switch.btn-mobile .menu-icon").removeClass($scope.Core.sidebarRight ? "glyphicon-menu-right" : "glyphicon-menu-left");
                        $(".menu-switch.btn-mobile .menu-icon").addClass("glyphicon-menu-hamburger");
                    }
                    $(".panelspace").toggleClass("panelspace-opened");
                    $("#toolbar").toggleClass("panelspace-opened");
                    $("#map").toggleClass("panelspace-opened");
                    $("#menu").toggleClass("panelspace-opened");
                }

                togglePanelspace = $scope.togglePanelspace;

                $scope.$emit('scope_loaded', "Mobile Toolbar");
            }

        ]);
    })
