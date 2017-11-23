/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ol','ngMaterial'],

    function(angular, ol, ngMaterial) {
        angular.module('hs.material.layerManager', ['ngMaterial'])
            
            .directive('hs.material.layermanager.directive', function() {
                return {
                    templateUrl: hsl_path + 'materialComponents/panelContents/layerManager.html?bust=' + gitsha,
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
                        if (angular.isUndefined(layer.style) && layer.layer.getSource().styleAble) getLayerStyle(layer);
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

                    function getLayerStyle(wrapper){
                        var layer = wrapper.layer;
                        var source = layer.getSource();
                        wrapper.style = {};
                        if (angular.isUndefined(layer.getStyle)) return;
                        var style = layer.getStyle();
                        if (typeof style == 'function') style = style(source.getFeatures()[0]);
                        if (typeof style == 'object') style = style[0];
                        style = style.clone();
                        if (source.hasPoly) {
                            wrapper.style.fillColor = style.getFill().getColor();
                        }
                        if (source.hasLine || source.hasPoly) {
                            wrapper.style.lineColor = style.getStroke().getColor();
                            wrapper.style.lineWidth = style.getStroke().getColor();
                        }
                        if (source.hasPoint) {
                            var image = style.getImage();
                            if (image instanceof ol.style.Circle) wrapper.style.pointType = 'Circle';
                            else if (image instanceof ol.style.RegularShape) {
                                wrapper.style.pointPoints = image.getPoints();
                                wrapper.style.rotation = image.getRotation();
                                if (angular.isUndefined(image.getRadius2()))wrapper.style.pointType = 'Polygon';
                                else {
                                    wrapper.style.pointType = 'Star';
                                    wrapper.style.radius2 = image.getRadius2();
                                }  
                            }
                            if (image instanceof ol.style.Circle || image instanceof ol.style.RegularShape) {
                                wrapper.style.radius = image.getRadius();
                                wrapper.style.pointFill = image.getFill().getColor();
                                wrapper.style.pointStroke = image.getStroke().getColor();
                                wrapper.style.pointWidth = image.getStroke().getWidth();
                            }
                            if (angular.isUndefined(wrapper.style.radius2)) wrapper.style.radius2 = wrapper.style.radius / 2;
                            if (angular.isUndefined(wrapper.style.pointPoints)) wrapper.style.pointPoints = 4;
                            if (angular.isUndefined(wrapper.style.rotation)) wrapper.style.rotation = Math.PI / 4;
                        }
                        wrapper.style.style = style;
                    }

                    $scope.saveStyle = function(layer){
                        setLayerStyle(layer);
                    }

                    function setLayerStyle(wrapper){
                        //debugger;
                        var layer = wrapper.layer;
                        var source = layer.getSource();
                        var style = wrapper.style.style;
                        if (source.hasPoly) {
                            style.setFill(new ol.style.Fill({
                                color: wrapper.style.fillColor
                            }));
                        }
                        if (source.hasLine || source.hasPoly) {
                            style.setStroke(new ol.style.Stroke({
                                color: wrapper.style.lineColor,
                                width: wrapper.style.lineWidth
                            }));
                        }
                        if (source.hasPoint) {
                            var image;
                            var stroke = new ol.style.Stroke({
                                color: wrapper.style.pointStroke,
                                width: wrapper.style.pointWidth
                            });
                            var fill = new ol.style.Fill({
                                color: wrapper.style.pointFill
                            });
                            if (wrapper.style.pointType === 'Circle') {
                                image = new ol.style.Circle({
                                    stroke: stroke,
                                    fill: fill,
                                    radius: wrapper.style.radius,
                                    rotation: wrapper.style.rotation
                                });
                            } 
                            if (wrapper.style.pointType === 'Polygon') {
                                image = new ol.style.RegularShape({
                                    stroke: stroke,
                                    fill: fill,
                                    radius: wrapper.style.radius,
                                    points: wrapper.style.pointPoints,
                                    rotation: wrapper.style.rotation
                                }); 
                            }
                            if (wrapper.style.pointType === 'Star') {
                                image = new ol.style.RegularShape({
                                    stroke: stroke,
                                    fill: fill,
                                    radius1: wrapper.style.radius,
                                    radius2: wrapper.style.radius2,
                                    points: wrapper.style.pointPoints,
                                    rotation: wrapper.style.rotation
                                });
                            }
                            style.setImage(image); 
                        }
                        layer.setStyle(style);
                    }

                    $scope.changePointType = function(layer,type) {
                        if (angular.isUndefined(layer.style)) getLayerStyle(layer);
                        layer.style.pointType = type;
                        setLayerStyle(layer);
                    }

                    $scope.icons = ["bag1.svg", "banking4.svg", "bar.svg", "beach17.svg", "bicycles.svg", "building103.svg", "bus4.svg", "cabinet9.svg", "camping13.svg", "caravan.svg", "church15.svg", "church1.svg", "coffee-shop1.svg", "disabled.svg", "favourite28.svg", "football1.svg", "footprint.svg", "gift-shop.svg", "gps40.svg", "gps41.svg", "gps42.svg", "gps43.svg", "gps5.svg", "hospital.svg", "hot-air-balloon2.svg", "information78.svg", "library21.svg", "location6.svg", "luggage13.svg", "monument1.svg", "mountain42.svg", "museum35.svg", "park11.svg", "parking28.svg", "pharmacy17.svg", "port2.svg", "restaurant52.svg", "road-sign1.svg", "sailing-boat2.svg", "ski1.svg", "swimming26.svg", "telephone119.svg", "toilets2.svg", "train-station.svg", "university2.svg", "warning.svg", "wifi8.svg"];

                    $scope.removeLayer = function (layer) {
                        OlMap.map.removeLayer(layer);
                        $rootScope.$broadcast('layermanager.updated'); //Rebuild the folder contents
                    }

                    $scope.$emit('scope_loaded', "MaterialLayerManager");
                }
            ]);
    })
