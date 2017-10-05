/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ngMaterial'],

    function(angular, ol) {
        angular.module('hs.material.mainToolbar', ['ngMaterial'])
            
            .directive('hs.material.maintoolbar.directive', function() {
                return {
                    templateUrl: hsl_path + 'examples/liberecMaterial/materialComponents/mainToolbar.html?bust=' + gitsha,
                    link: function(scope, element) {

                    }
                };
            })
            .controller('hs.material.mainToolbar.controller', ['$scope', 'config', 
                function($scope, config) {
                    $scope.buttons = [
                        {
                            item: 'basemap',
                            tooltip: 'Change map basemap',
                            icon: 'map',
                            show: (angular.isDefined(config.mainToolbar) && angular.isDefined(config.mainToolbar.basemap)) ? config.mainToolbar.basemap : true
                        },
                        {
                            item: 'layerManager',
                            tooltip: 'Manage your layers',
                            icon: 'layers',
                            show: (angular.isDefined(config.mainToolbar) && angular.isDefined(config.mainToolbar.layerManager)) ? config.mainToolbar.layerManager : true
                        },
                        {
                            item: 'addLayer',
                            tooltip: 'Add layer to map',
                            icon: 'add box',
                            show:  (angular.isDefined(config.mainToolbar) && angular.isDefined(config.mainToolbar.addLayer)) ? config.mainToolbar.addLayer : false
                        }
                    ];

                    $scope.buttonClicked = function(button) {
                        $scope.$emit('menuButtonClicked', button);
                        console.log("sendo");
                    }

                    if (angular.isDefined(config.mainToolbar) && angular.isDefined(config.mainToolbar.customButton)) {
                        
                    }

                    /*
                        config.mainToolbar.buttonStatus.xxx
                    */

                    $scope.$emit('scope_loaded', "MainToolbar");
                }
            ]);
    })
