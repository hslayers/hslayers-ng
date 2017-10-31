/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ol', 'ngMaterial'],

    function (angular, ol, ngMaterial) {
        angular.module('hs.material.composition', ['ngMaterial'])

            .directive('hs.material.composition.directive', function () {
                return {
                    templateUrl: hsl_path + 'materialComponents/panelContents/composition.html?bust=' + gitsha,
                    link: function (scope, element) {

                    }
                };
            })
            .controller('hs.material.composition.controller', ['$scope', 'Core', 'hs.compositions.service', '$window', '$mdDialog',
                function ($scope, Core, Composition, $window, $mdDialog) {
                    $scope.data = Composition.data;
                    /**
                    * @ngdoc property
                    * @name hs.compositions.controller#page_size
                    * @public
                    * @type {number} 15
                    * @description Number of compositions displayed on one panel page
                    */
                    $scope.pageSize = 15;
                    $scope.compStart = 0;
                    $scope.compNext = $scope.pageSize;
                    $scope.sortBy = 'bbox';
                    $scope.filterByExtent = true;

                    $scope.getPreviousCompositions = function () {
                        if ($scope.compStart - $scope.pageSize < 0) {
                            $scope.compStart = 0;
                            $scope.compNext = $scope.pageSize;
                        } else {
                            $scope.compStart -= $scope.pageSize;
                            $scope.compNext = $scope.compStart + $scope.pageSize;
                        }
                        $scope.loadCompositions();
                    }

                    $scope.getNextCompositions = function () {
                        if ($scope.compNext != 0) {
                            $scope.compStart = Math.floor($scope.compNext / $scope.pageSize) * $scope.pageSize;

                            if ($scope.compNext + $scope.pageSize > $scope.compositionsCount) {
                                $scope.compNext = $scope.compositionsCount;
                            } else {
                                $scope.compNext += $scope.pageSize;
                            }
                            $scope.loadCompositions();
                        }
                    }

                    $scope.loadCompositions = function () {
                        Composition.loadCompositions({
                            query: $scope.query,
                            sortBy: $scope.sortBy,
                            filterExtent: $scope.filterByExtent,
                            start: $scope.compStart,
                            limit: $scope.pageSize
                        });
                    }

                    $scope.$watch('data.next', function () {
                        $scope.compNext = $scope.data.next;
                    })

                    $scope.getPageSize = function () {
                        var panel = angular.element('#sidenav-right');
                        var listItemCount = Math.round((panel.height() - 180) / 60);
                        $scope.pageSize = listItemCount;
                    }

                    $scope.filterChanged = function () {
                        Composition.resetCompositionCounter();
                        $scope.compStart = 0;
                        $scope.compNext = $scope.pageSize;
                        $scope.loadCompositions();
                    }

                    $scope.confirmDelete = function (composition, ev) {
                        $scope.compositionToDelete = composition;
                        deleteDialog(ev);
                    }

                    function deleteDialog(ev) {
                        $mdDialog.show({
                            parent: angular.element('#hsContainer'),
                            targetEvent: ev,
                            clickOutsideToClose: true,
                            escapeToClose: true,
                            scope: $scope,
                            preserveScope: true,  
                            templateUrl: 'materialComponents/panelContents/compositionLoadUnsavedDialog.html',
                            controller: function DialogController($scope, $mdDialog) {
                                $scope.closeDialog = function () {
                                    $mdDialog.hide();
                                }
                            }
                        });
                    }

                    $scope.delete = function (composition) {
                        Composition.deleteComposition(composition);
                    }

                    $scope.edit = function (composition) {
                        $scope.data.useCallbackForEdit = true;
                        Composition.loadComposition(composition);
                    }

                    $scope.highlightComposition = function (composition, state) {
                        Composition.highlightComposition(composition, state);
                    }

                    $scope.$on('map.extent_changed', function (event, data, b) {
                        if (Core.mainpanel != 'composition_browser' && Core.mainpanel != 'composition') return;
                        if ($scope.filterByExtent) $scope.loadCompositions();
                    });

                    $scope.shareComposition = function (record, $event) {
                        Composition.shareComposition(record);
                        shareDialog($event);
                    }

                    function shareDialog($event) {
                        $mdDialog.show({
                            parent: angular.element('#hsContainer'),
                            targetEvent: $event,
                            clickOutsideToClose: true,
                            escapeToClose: true,
                            scope: $scope,
                            preserveScope: true,  
                            templateUrl: 'materialComponents/panelContents/compositionShareDialog.html',
                            controller: function DialogController($scope, $mdDialog) {
                                $scope.closeDialog = function () {
                                    $mdDialog.hide();
                                }
                            }
                        });
                    }


                    $scope.detailComposition = function (record, $event) {
                        $scope.info = Composition.getCompositionInfo(record);
                        infoDialog($event);
                    }

                    function infoDialog($event) {
                        var parentEl = angular.element('#hsContainer');
                        $mdDialog.show({
                            parent: parentEl,
                            targetEvent: $event,
                            clickOutsideToClose: true,
                            escapeToClose: true,
                            template:
                            '<md-dialog aria-label="List dialog">' +
                            '  <md-dialog-content layout="column" layout-padding>' +
                            '    <md-list>' +
                            '    <div layout="row">' +
                            '       <span flex="30">Abstract</span><span flex="70">{{info.abstract}}</span>' +
                            '    </div>' +
                            '    <div layout="row">' +
                            '       <span flex="30">Thumbnail</span><span flex="70">{{info.thumbnail}}</span>' +
                            '    </div>' +
                            '    <div layout="row">' +
                            '       <span flex="30">Extent</span><span flex="70">{{info.extent}}</span>' +
                            '    </div>' +
                            '    <div layout="row" ng-repeat="layer in info.layers">' +
                            '       <span flex="30">Layer</span><span flex="70">{{layer.title}}</span>' +
                            '    </div>' +
                            '    </md-list>' +
                            '  </md-dialog-content>' +
                            '  <md-dialog-actions>' +
                            '    <md-button ng-click="closeDialog()" class="md-primary">' +
                            '      Close' +
                            '    </md-button>' +
                            '  </md-dialog-actions>' +
                            '</md-dialog>',
                            locals: {
                                info: $scope.info
                            },
                            controller: DialogController
                        });
                        function DialogController($scope, $mdDialog, info) {
                            $scope.info = info;
                            $scope.closeDialog = function () {
                                $mdDialog.hide();
                            }
                        }
                    }

                    $scope.loadComposition = function (record) {
                        Composition.loadCompositionParser(record);
                    }

                    $scope.overwrite = function () {
                        Composition.loadComposition($scope.compositionToLoad, true);
                    }

                    $scope.add = function () {
                        Composition.loadComposition($scope.compositionToLoad, false);
                    }

                    $scope.save = function () {
                        Core.openStatusCreator();
                    }

                    $scope.setSortAttribute = function (attribute) {
                        $scope.loadCompositions();
                    }

                    $scope.$on('loadComposition.notSaved', function (event, data) {
                        $scope.compositionToLoad = data.link;
                        loadUnsavedDialog();
                    });

                    function loadUnsavedDialog() {
                        $mdDialog.show({
                            parent: angular.element('#hsContainer'),
                            clickOutsideToClose: true,
                            escapeToClose: true,
                            scope: $scope,
                            preserveScope: true,  
                            templateUrl: 'materialComponents/panelContents/compositionLoadUnsavedDialog.html',
                            controller: function DialogController($scope, $mdDialog) {
                                $scope.closeDialog = function () {
                                    $mdDialog.hide();
                                }
                            }
                        });
                    }

                    $scope.$on('core.mainpanel_changed', function (event) {
                        if (Core.mainpanel === 'composition_browser' || Core.mainpanel === 'composition') {
                            $scope.loadCompositions();
                        }
                    });

                    $scope.getPageSize();
                    angular.element($window).resize(function () {
                        $scope.getPageSize();
                    });
                    $scope.$on("Core_sizeChanged", function () {
                        $scope.getPageSize();
                    });

                    $scope.$emit('scope_loaded', "MaterialComposition");
                }
            ]);
    })
