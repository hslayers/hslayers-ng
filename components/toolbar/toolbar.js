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

                $scope.$on('compositions.composition_loaded', function(event, data) {
                    $scope.composition_abstract = data.data.abstract || data.abstract;
                    $scope.composition_title = data.data.title || data.title;
                    $scope.composition_id = data.data.id || data.id;
                });

                $scope.$on('compositions.composition_deleted', function(event, id) {
                    if (id == $scope.composition_id) {
                        delete $scope.composition_title;
                        delete $scope.composition_abstract;
                        if (!$scope.$$phase) $scope.$digest();
                    }
                });

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
