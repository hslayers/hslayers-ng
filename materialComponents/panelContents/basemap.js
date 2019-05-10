/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ol','angular-material'],

    function(angular, ol, ngMaterial) {
        angular.module('hs.material.basemap', ['ngMaterial'])
            
            .directive('hs.material.basemap.directive', ['config', function (config) {
                return {
                    template: require('materialComponents/panelContents/basemap.html'),
                    link: function(scope, element) {

                    }
                };
            }])
            .controller('hs.material.basemap.controller', ['$scope', 'config', 'hs.map.service', 'hs.layermanager.service', '$mdDialog', 
                function($scope, config, OlMap, LayMan, $mdDialog) {
                    $scope.data = LayMan.data;

                    $scope.changeBaseLayerVisibility = LayMan.changeBaseLayerVisibility;
                    
                    $scope.removeLayer = function (layer) {
                        var active = layer.active;
                        OlMap.map.removeLayer(layer.layer);
                        if (active) {
                            if ($scope.data.baselayers.length > 0) $scope.changeBaseLayerVisibility(true,$scope.data.baselayers[0]);
                        }
                    }

                    $scope.hasImage = function(layer) {
                        return angular.isDefined(layer.layer.get('img')) ? true : false;
                    }

                    $scope.getImage = function(layer) {
                        return layer.layer.get('img');
                    }

                    $scope.isRemovable = function(layer) {
                        return layer.layer.get('removable');
                    }

                    $scope.showRemoveDiag = function(e, layer) {
                        var confirm = $mdDialog.confirm()
                            .title('Remove basemap ' + layer.title)
                            .textContent('Are you sure about layer removal?')
                            .ariaLabel('Confirm layer removal')
                            .targetEvent(e)
                            .ok('Remove')
                            .cancel('Cancel');
              
                        $mdDialog.show(confirm).then(function() {
                            $scope.removeLayer(layer);
                        }, function() {
                        });
                    }

                    $scope.$emit('scope_loaded', "MaterialBasemap");
                }
            ]);
    })
