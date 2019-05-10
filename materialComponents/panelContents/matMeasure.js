/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ol','angular-material'],

    function(angular, ol, ngMaterial) {
        angular.module('hs.material.measure', ['ngMaterial'])
            
            .directive('hs.material.measure.directive', ['config', function (config) {
                return {
                    template: require('materialComponents/panelContents/matMeasure.html'),
                    link: function(scope, element) {

                    }
                };
            }])
            .controller('hs.material.measure.controller', ['$scope', 'hs.map.service', 'Core', 'hs.measure.service', 
                function($scope, OlMap, Core, Measure) {
                    $scope.data = Measure.data;

                    $scope.type = 'distance';

                    $scope.$watch('type', function() {
                        if (Core.mainpanel == "measure")
                        Measure.changeMeasureParams($scope.type);
                    });

                    $scope.clearAll = function() {
                        Measure.clearMeasurement();
                        if (!$scope.$$phase) $scope.$digest();
                    }

                    $scope.clearOne = function(index) {
                        $scope.data.measurements.splice(index,1);
                    }

                    $scope.saveToLayer = function() {
                        //
                    }

                    $scope.$on('core.mainpanel_changed', function(event) {
                        if (Core.mainpanel == 'measure') {
                            Measure.activateMeasuring($scope.type);
                            Core.current_panel_queryable = false;
                        } else {
                            Measure.deactivateMeasuring();
                            Core.current_panel_queryable = true;
                        }
                    });

                    $scope.$emit('scope_loaded', "MaterialMeasure");
                }
            ]);
    })
