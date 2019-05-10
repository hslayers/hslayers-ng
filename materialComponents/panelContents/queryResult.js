/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ol', 'angular-material'],

    function (angular, ol, ngMaterial) {
        angular.module('hs.material.query', ['ngMaterial'])

            .directive('hs.material.query.directive', ['config', function (config) {
                return {
                    template: require('materialComponents/panelContents/queryResult.html'),
                    link: function (scope, element) {

                    }
                };
            }])
            .controller('hs.material.query.controller', ['$scope', '$rootScope', 'hs.map.service', 'hs.query.baseService', 'hs.query.wmsService', 'hs.query.vectorService', 'Core', 'hs.material.sidepanel.service',
                function ($scope, $rootScope, OlMap, Base, WMS, Vector, Core, Sidenav) {

                    $scope.data = Base.data;

                    $scope.queriedLayers = [];
                    $scope.currentLayer = "";

                    $scope.$on('queryVectorResult', function () {
                        Sidenav.setActiveDirective('sidenav-left','query');
                        getQueriedLayers();
                    });

                    $scope.$on('queryWmsResult', function () {
                        getQueriedLayers();
                        Sidenav.setActiveDirective('sidenav-left','query');
                    });

                    function getQueriedLayers() {
                        $scope.queriedLayers.length = 0;
                        angular.forEach($scope.data.groups, function (group) {
                            if ($scope.queriedLayers.indexOf(group.layer) < 0)
                                $scope.queriedLayers.push(group.layer);
                        });
                        $scope.queriedLayers.sort(); //Primitive implementation
                        if ($scope.queriedLayers.length > 0) {
                            if ($scope.queriedLayers.indexOf($scope.currentLayer) < 0) {
                                $scope.currentLayer = $scope.queriedLayers[0];
                            }
                        }
                        else $scope.currentLayer = "";
                        if (!$scope.$$phase) $scope.$digest();
                    }

                    $scope.changeLayer = function (layer) {
                        $scope.currentLayer = layer;
                    }

                    if (Core.current_panel_queryable) {
                        if (!Base.queryActive) Base.activateQueries();
                    }
                    else {
                        if (Base.queryActive) Base.deactivateQueries();
                    }

                    $scope.$on('core.mainpanel_changed', function (event, closed) {
                        if (angular.isDefined(closed) && closed.panel_name == "info") {
                            Base.deactivateQueries();
                        }
                        else if (Core.current_panel_queryable) {
                            if (!Base.queryActive) Base.activateQueries();
                        }
                        else {
                            if (Base.queryActive) Base.deactivateQueries();
                        }
                    });

                    $scope.$emit('scope_loaded', "MaterialQuery");
                }
            ]);
    })
