/**
 * @namespace hs.material.search
 * @memberOf hs
 */
<<<<<<< HEAD
define(['angular', 'ol','ngMaterial'],

    function(angular, ol, ngMaterial) {
=======
define(['angular', 'ngMaterial'],

    function(angular, ol) {
>>>>>>> c3a46fdf503d98fe426609a2c0b4b047be7e1658
        angular.module('hs.material.layerManager', ['ngMaterial'])
            
            .directive('hs.material.layermanager.directive', function() {
                return {
                    templateUrl: hsl_path + 'examples/liberecMaterial/materialComponents/panelContents/layerManager.html?bust=' + gitsha,
                    link: function(scope, element) {

                    }
                };
            })
            .controller('hs.material.layermanager.controller', ['$scope', 'config', 'hs.map.service', 'hs.layermanager.service', '$rootScope', '$mdDialog',
                function($scope, config, OlMap, LayMan, $rootScope, $mdDialog) {

                    $scope.data = LayMan.data;
                    $scope.shiftDown = false;

                    $scope.expandLayer = function(layer){
                        if (angular.isUndefined(layer.expanded)) layer.expanded = true;
                        else layer.expanded = !layer.expanded;
                    }

                    $scope.expandSettings = function(layer,value){
                        if (angular.isUndefined(layer.opacity)) {
                            layer.opacity = layer.layer.getOpacity();
                            layer.maxResolutionLimit = layer.layer.getMaxResolution();
                            layer.minResolutionLimit = layer.layer.getMinResolution();
                            layer.maxResolution = layer.maxResolutionLimit;
                            layer.minResolution = layer.minResolutionLimit;
                        }
                        layer.expandSettings = value;
                    }

                    $scope.setOpacity = function(layer) {
                        layer.layer.setOpacity(layer.opacity);
                        $scope.$emit('compositions.composition_edited');
                    }

                    $scope.updateResolution = function(layer) {
                        layer.layer.setMaxResolution(layer.maxResolution);
                        layer.layer.setMinResolution(layer.minResolution);
                    }

                    $scope.expandInfo = function(layer,value){
                        layer.expandInfo = value;
                    }

                    $scope.changeLayerVisibility = LayMan.changeLayerVisibility;

                    $scope.layerOrder = function(layer){
                        return layer.layer.get('position')
                    }

                    $scope.changePosition = function(layer,direction,$event) {
                        var index = layer.layer.get('position');
                        var layers = OlMap.map.getLayers();
                        var toIndex = index;;
                        if (direction) {// upwards
                            var max = layers.getLength() - 1;
                            if (index < max) {
                                if ($event.shiftKey) toIndex = max;
                                else toIndex = index+1;
                            }
                        }
                        else {//downwards
                            var min;
                            for (var i = 0; i < layers.getLength(); i++) {
                                if (layers.item(i).get('base') != true) {
                                    min = i;
                                    break;
                                }
                            }
                            if (index > min) {
                                if ($event.shiftKey) toIndex = min;
                                else toIndex = index-1;
                            }
                        }
                        var moveLayer = layers.item(index);
                        layers.removeAt(index);
                        layers.insertAt(toIndex, moveLayer);
                        LayMan.updateLayerOrder();
                        $rootScope.$broadcast('layermanager.updated'); //Rebuild the folder contents
                    }

                    $scope.showRemoveLayerDiag = function(e, layer) {
                        var confirm = $mdDialog.confirm()
                            .title('Remove layer ' + layer.title)
                            .textContent('Are you sure about layer removal?')
                            .ariaLabel('Confirm layer removal')
                            .targetEvent(e)
                            .ok('Remove')
                            .cancel('Cancel');
              
                        $mdDialog.show(confirm).then(function() {
                            $scope.removeLayer(layer.layer);
                        }, function() {
                        });
                    }

                    $scope.isLayerType = function(layer, type) {
                        switch (type) {
                            case 'wms':
                                return isWms(layer);
                            case 'point':
                                return layer.getSource().hasPoint;
                            case 'line':
                                return layer.getSource().hasLine;
                            case 'polygon':
                                return layer.getSource().hasPoly;
                            default:
                                return false;
                        }
                    }

                    function isWms(layer){
                        return (layer.getSource() instanceof ol.source.TileWMS || layer.getSource() instanceof ol.source.ImageWMS);
                    }

                    $scope.setProp = function(layer,property,value) {
                        layer.set(property, value);
                    }

                    $scope.layerOpacity = 50;

                    $scope.removeLayer = function (layer) {
                        OlMap.map.removeLayer(layer);
                        $rootScope.$broadcast('layermanager.updated'); //Rebuild the folder contents
                    }

                    $scope.$emit('scope_loaded', "MaterialLayerManager");
                }
            ]);
    })
