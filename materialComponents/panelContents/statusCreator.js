/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ol', 'ngMaterial', 'ngAnimate'],

    function (angular, ol, ngMaterial, ngclipboard) {
        angular.module('hs.material.statusCreator', ['ngMaterial'])

            .directive('hs.material.statuscreator.directive', function () {
                return {
                    templateUrl: hsl_path + 'materialComponents/panelContents/statusCreator.html?bust=' + gitsha,
                    link: function (scope, element) {

                    }
                };
            })
            .controller('hs.material.statuscreator.controller', ['$scope', 'hs.map.service', 'Core', 'hs.status_creator.service', 'hs.status_creator.managerService', '$mdDialog', 'hs.material.sidepanel.service', 
                function ($scope, OlMap, Core, status_creator, StatusManager, $mdDialog, Sidenav) {

                    $scope.compoData = StatusManager.compoData;
                    $scope.statusData = StatusManager.statusData;
                    $scope.userData = StatusManager.userData;
                    $scope.thumbnailVisible = false;
                    $scope.showExpanded = false;

                    $scope.reset = function () {
                        StatusManager.resetCompoData();
                    }

                    $scope.confirmSave = function () {
                        StatusManager.confirmSave();
                    }

                    $scope.save = function (saveAsNew) {
                        StatusManager.save(saveAsNew);
                    }

                    $scope.$on('StatusManager.saveResult', function (e, result) {
                        if (result === 1) {
                            showResultsDialog();
                            Sidenav.closeSidenav('sidenav-right');
                        }
                        else if (result === 2) {
                            showSaveDialog();
                        }
                        else if (result === 3) {
                            showResultsDialog();
                        }
                    })

                    $scope.selectNewTitle = function () {
                        $scope.compoData.title = $scope.statusData.guessedTitle;
                        $scope.changeTitle = true;
                    }

                    $scope.getCurrentExtent = function () {
                        $scope.compoData.bbox = StatusManager.getCurrentExtent();
                    }

                    $scope.closeDialog = function(){
                        $mdDialog.hide();
                    }

                    function showResultsDialog() {
                        $mdDialog.show({
                            parent: angular.element('#hsContainer'),
                            clickOutsideToClose: true,
                            escapeToClose: true,
                            scope: $scope,
                            preserveScope: true,  
                            templateUrl: 'materialComponents/panelContents/statusCreatorResultsDialog.html'
                        });
                    }
                    
                    function showSaveDialog() {
                        $mdDialog.show({
                            parent: angular.element('#hsContainer'),
                            clickOutsideToClose: true,
                            escapeToClose: true,
                            scope: $scope,
                            preserveScope: true,  
                            templateUrl: 'materialComponents/panelContents/statusCreatorSaveDialog.html'
                        });
                    }

                    $scope.$on('core.mainpanel_changed', function (event) {
                        if (Core.mainpanel == 'statusCreator') {
                            if (!Core.isAuthorized()) {
                                showUnauthorized();
                                Sidenav.closeSidenav('sidenav-right');
                            }
                        }
                    });

                    function showUnauthorized() {
                        $mdDialog.show(
                            $mdDialog.alert()
                                .parent(angular.element(document.querySelector('#hsContainer')))
                                .clickOutsideToClose(true)
                                .title('Unauthorized user')
                                .textContent('You are not authorized to store composition. Please sign in or contact administrator for your credentials.')
                                .ariaLabel('Unauthorized user dialog')
                                .ok('OK')
                        );
                    };

                    $scope.$emit('scope_loaded', "MaterialSharemap");
                }

            ]);
    })
