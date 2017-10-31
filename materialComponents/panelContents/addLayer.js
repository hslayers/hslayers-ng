define(['angular', 'ol','ngMaterial', 'ows.wms'],

    function(angular, ol, ngMaterial) {
        angular.module('hs.material.addLayer', ['ngMaterial', 'hs.ows.wms'])
            
            .directive('hs.material.addlayer.directive', function() {
                return {
                    templateUrl: hsl_path + 'materialComponents/panelContents/addLayer.html?bust=' + gitsha,
                    link: function(scope, element) {

                    }
                };
            })
            .directive('hs.material.addlayerwebservice.directive', function() {
                return {
                    templateUrl: hsl_path + 'materialComponents/panelContents/addLayerWebservice.html?bust=' + gitsha
                };
            })
            .controller('hs.material.addlayerwebservice.controller', ['$scope', 'config', 'hs.ows.wms.service_capabilities', 'hs.ows.wms.addLayerService',
                function($scope, config, WmsCaps, WmsAdd) {

                    $scope.data = WmsAdd.data;
                    $scope.types = ["WMS"];
                    $scope.type = "";
                    $scope.url = "";
                    $scope.loading = false;

                    $scope.connect = function() {
                        $scope.loading = true;
                        switch ($scope.type.toLowerCase()) {
                            case "wms":
                                WmsCaps.requestGetCapabilities($scope.url);
                                break;
                        }
                    }

                    $scope.urlChanged = function(){
                        angular.forEach($scope.types, function(type){
                            if ($scope.url.toLowerCase().indexOf(type.toLowerCase()) > -1) $scope.type = type;  
                        });
                    }

                    $scope.$on('wmsCapsParsed', function(){
                        $scope.loading = false;
                        $scope.showAdvanced = true;
                    })

                    $scope.clear = function() {
                        $scope.url = '';
                        $scope.showAdvanced = false;
                    }

                    $scope.selectAllLayers = function(){
                        var recurse = function(layer) {
                            layer.checked = true;

                            angular.forEach(layer.Layer, function(sublayer) {
                                recurse(sublayer)
                            })
                        }
                        angular.forEach($scope.data.services.Layer, function(layer) {
                            recurse(layer)
                        });
                    }

                    $scope.addLayers = function(checked){
                        WmsAdd.addLayers(checked);
                    }

                    $scope.srsChanged = function(){
                        WmsAdd.srsChanged();
                    }

                    $scope.hasNestedLayers = function(layer) {
                        return typeof layer.Layer !== 'undefined';
                    }

                    $scope.$emit('scope_loaded', "MaterialAddLayerWebservice");
                }
            ]);
    })
