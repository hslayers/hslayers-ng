/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ngMaterial'],

    function(angular, ol) {
        angular.module('hs.material.layerManager', ['ngMaterial'])
            
            .directive('hs.material.layermanager.directive', function() {
                return {
                    templateUrl: hsl_path + 'examples/liberecMaterial/materialComponents/panelContents/layerManager.html?bust=' + gitsha,
                    link: function(scope, element) {

                    }
                };
            })
            .controller('hs.material.layermanager.controller', ['$scope', 'config', 'hs.map.service', 'hs.layermanager.service', 
                function($scope, config, OlMap, LayMan) {

                    $scope.data = LayMan.data;

                    $scope.expandLayer = function(layer){
                        if (angular.isUndefined(layer.expanded)) layer.expanded = true;
                        else layer.expanded = !layer.expanded;
                    }

                    $scope.changeLayerVisibility = LayMan.changeLayerVisibility;

                    $scope.$emit('scope_loaded', "MaterialLayerManager");
                }
            ]);
    })
