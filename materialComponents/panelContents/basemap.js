/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ol','ngMaterial'],

    function(angular, ol, ngMaterial) {
        angular.module('hs.material.basemap', ['ngMaterial'])
            
            .directive('hs.material.basemap.directive', function() {
                return {
                    templateUrl: hsl_path + 'materialComponents/panelContents/basemap.html?bust=' + gitsha,
                    link: function(scope, element) {

                    }
                };
            })
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

                    $scope.isRemoveable = function(layer) {
                        return layer.layer.get('removeable');
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
