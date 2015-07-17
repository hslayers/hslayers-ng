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

        .controller('hs.toolbar.controller', ['$scope', 'hs.map.service', 'Core', 'hs.permalink.service_url',
            function($scope, OlMap, Core, bus) {
                $scope.Core = Core;
                var collapsed = false;

                $scope.setMainPanel = function(which) {
                    Core.setMainPanel(which, true);
                    if (!$scope.$$phase) $scope.$digest();
                }

                if (bus.getParamValue('hs_panel')) {
                    $scope.setMainPanel(bus.getParamValue('hs_panel'));
                }
                
                $scope.collapsed = function(is){
                    if (arguments.length>0){
                        collapsed = is;
                    }
                    return collapsed;
                }

                $scope.$emit('scope_loaded', "Toolbar");
            }

        ]);
    })
