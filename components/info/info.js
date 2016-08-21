/**
 * @namespace hs.info
 * @memberOf hs
 */
define(['angular', 'map', 'core', 'ngMeta', 'permalink'],

    function(angular) {
        angular.module('hs.info', ['hs.map', 'hs.core', 'ngMeta'])
            .directive('hs.info.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/info/partials/info.html?bust=' + gitsha

                };
            })

        .controller('hs.info.controller', ['$rootScope', '$scope', '$timeout', 'Core', 'ngMeta',
            function($rootScope, $scope, $timeout, Core, ngMeta) {
                $scope.Core = Core;
                $scope.composition_loaded = true;
                $scope.layer_loading = [];

                $scope.$on('compositions.composition_loading', function(event, data) {
                    if (angular.isUndefined(data.error)) {
                        if (angular.isDefined(data.data)) {
                            $scope.composition_abstract = data.data.abstract;
                            $scope.composition_title = data.data.title;
                            ngMeta.setTitle(data.data.title);
                            $scope.composition_id = data.data.id;
                        } else {
                            $scope.composition_abstract = data.abstract;
                            $scope.composition_title = data.title;
                            ngMeta.setTitle(data.title);
                            $scope.composition_id = data.id;
                        }
                        $scope.composition_loaded = false;
                        $scope.info_image = 'icon-map';
                    }
                    if (!$scope.$$phase) $scope.$digest();
                });

                $scope.$on('compositions.composition_loaded', function(event, data) {
                    if (angular.isDefined(data.error)) {
                        var temp_abstract = $scope.composition_abstract;
                        var temp_title = $scope.composition_title;
                        $scope.composition_abstract = data.abstract;
                        $scope.composition_title = data.title;
                        ngMeta.setTitle(data.title);
                        $scope.info_image = 'glyphicon-warning-sign';
                        $timeout(function() {
                            $scope.composition_title = temp_title;
                            ngMeta.setTitle(temp_title);
                            $scope.composition_abstract = temp_abstract;
                            $scope.info_image = 'icon-map';
                            if (!$scope.$$phase) $scope.$digest();
                        }, 3000);
                    }
                    $scope.composition_loaded = true;
                    $scope.composition_edited = false;
                    if (!$scope.$$phase) $scope.$digest();
                });

                $scope.$on('layermanager.layer_loading', function(event, layer) {
                    if (!(layer.get('title') in $scope.layer_loading)) {
                        $scope.layer_loading.push(layer.get('title'));
                    }
                    $scope.composition_loaded = false;
                    if (!$scope.$$phase) $scope.$digest();
                })

                $scope.$on('layermanager.layer_loaded', function(event, layer) {
                    for (var i = 0; i < $scope.layer_loading.length; i++) {
                        if ($scope.layer_loading[i] == layer.get('title')) {
                            $scope.layer_loading.splice(i, 1);
                        }
                    }

                    if ($scope.layer_loading.length == 0) {
                        $scope.composition_loaded = true;
                    }
                    if (!$scope.$$phase) $scope.$digest();
                })

                $scope.$on('compositions.composition_deleted', function(event, id) {
                    if (id == $scope.composition_id) {
                        delete $scope.composition_title;
                        ngMeta.setTitle('HSLayers-NG');
                        delete $scope.composition_abstract;
                        if (!$scope.$$phase) $scope.$digest();
                    }
                });

                $scope.$on('core.map_reset', function(event) {
                    delete $scope.composition_title;
                    delete $scope.composition_abstract;
                    $scope.layer_loading = [];
                    $scope.composition_loaded = true;
                    $scope.composition_edited = false;
                    if (!$scope.$$phase) $scope.$digest();
                });

                $scope.compositionLoaded = function() {
                    return angular.isDefined($scope.composition_title);
                }

                $rootScope.$on('compositions.composition_edited', function(event) {
                    $scope.composition_edited = true;
                });

                $scope.$emit('scope_loaded', "info");
            }

        ]);
    })
