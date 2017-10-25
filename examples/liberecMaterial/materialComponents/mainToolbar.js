/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ol','ngMaterial'],

    function(angular, ol, ngMaterial) {
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
                            show:  (angular.isDefined(config.mainToolbar) && angular.isDefined(config.mainToolbar.addLayer)) ? config.mainToolbar.addLayer : false,
                            menu: [
                                {
                                    item: 'addWMS',
                                    icon: 'image',
                                    text: 'WMS Layer'
                                },
                                {
                                    item: 'addWMS',
                                    text: 'WFS Layer'
                                },
                                {
                                    item: 'addWMS',
                                    icon: 'file_download',
                                    text: 'Local file'
                                },
                            ]
                        },
                        {
                            item: 'composition',
                            tooltip: 'Browse map compositions',
                            icon: 'view_list',
                            show:  (angular.isDefined(config.mainToolbar) && angular.isDefined(config.mainToolbar.addLayer)) ? config.mainToolbar.addLayer : false
                        }
                    ];

                    $scope.buttonClicked = function(button) {
                        $scope.$emit('menuButtonClicked', button);
                    }

                    $scope.openMenu = function($mdmenu, ev){
                        $mdMenu.open(ev);
                    }

                    $scope.checkMenu = function(button){
                        return angular.isDefined(button.menu) ? true : false;
                    }

                    if (angular.isDefined(config.mainToolbar) && angular.isDefined(config.mainToolbar.customButton)) {
                        
                    }

                    $scope.$emit('scope_loaded', "MainToolbar");
                }
            ]);
    })
