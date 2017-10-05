/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ngMaterial'],

    function(angular, ol) {
        angular.module('hs.material.addLayer', ['ngMaterial'])
            
            .directive('hs.material.addlayer.directive', function() {
                return {
                    templateUrl: hsl_path + 'examples/liberecMaterial/materialComponents/panelContents/addLayer.html?bust=' + gitsha,
                    link: function(scope, element) {

                    }
                };
            })
            .controller('hs.material.addlayer.controller', ['$scope', 'config', 
                function($scope, config) {

                    $scope.$emit('scope_loaded', "MaterialLayerManager");
                }
            ]);
    })
