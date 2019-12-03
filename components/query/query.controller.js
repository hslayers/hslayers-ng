import Popup from 'ol-popup';
import 'ol-popup/src/ol-popup.css';
import { remove } from 'lodash';

export default ['$scope', '$rootScope', '$timeout', 'hs.map.service', 'hs.query.baseService', 'hs.query.wmsService', 'hs.query.vectorService', 'Core', 'config', 'hs.layout.service',
    function ($scope, $rootScope, $timeout, OlMap, Base, WMS, Vector, Core, config, layoutService) {
        var popup = new Popup();

        OlMap.loaded().then(map => {
            map.addOverlay(popup);
        });

        try {
            var $mdDialog = $injector.get('$mdDialog');

            $scope.showQueryDialog = function (ev) {
                $mdDialog.show({
                    scope: this,
                    preserveScope: true,
                    template: require('components/query/partials/infopanel.html'),
                    parent: angular.element(document.body),
                    targetEvent: ev,
                    clickOutsideToClose: true
                })
                    .then(function () {
                        console.log("Closed.");
                    }, function () {
                        console.log("Cancelled.");
                    });
            };

            $scope.cancelQueryDialog = function () {
                $mdDialog.cancel();
            };

            $scope.showNoImagesWarning = function () {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent("No images matched the query.")
                    // .position(pinTo )
                    // .hideDelay(3000)
                );
            }
        } catch (ex) {

        }

        $scope.data = Base.data;


        var deregisterQueryStatusChanged = $rootScope.$on('queryStatusChanged', function () {
            if (Base.queryActive) {
                $scope.deregisterVectorQuery = $scope.$on('mapQueryStarted', function (e) {
                    if (config.design === 'md' && $scope.data.groups.length === 0) {
                        $scope.showNoImagesWarning();
                    }
                    if (config.design === 'md' && $scope.data.groups.length > 0) {
                        $scope.showQueryDialog(e);
                    } else {
                        popup.hide();
                        if (Base.currentPanelQueryable()) layoutService.setMainPanel('info');
                    }
                });

                $scope.deregisterWmsQuery = $scope.$on('queryWmsResult', function (e, coordinate) {
                    $timeout(function () {
                        var invisiblePopup = Base.getInvisiblePopup();
                        if (invisiblePopup.contentDocument.body.children.length > 0) { //TODO: dont count style, title, meta towards length
                            if (Base.popupClassname.length > 0) popup.getElement().className = Base.popupClassname;
                            else popup.getElement().className = "ol-popup";
                            popup.show(coordinate, invisiblePopup.contentDocument.body.innerHTML);
                            $rootScope.$broadcast('popupOpened', 'hs.query');
                        }
                    })
                });
            } else {
                if ($scope.deregisterVectorQuery) $scope.deregisterVectorQuery();
                if ($scope.deregisterWmsQuery) $scope.deregisterWmsQuery();
            }
        });
        $scope.$on('$destroy', function () {
            if (deregisterQueryStatusChanged) deregisterQueryStatusChanged();
        });

        $scope.$on('queryVectorResult', function () {
            if (!$scope.$$phase) $scope.$digest();
        });

        //add current panel queriable - activate/deactivate
        $scope.$on('core.mainpanel_changed', function (event, closed) {
            if (Base.currentPanelQueryable()) {
                if (!Base.queryActive) Base.activateQueries();
            }
            else {
                if (Base.queryActive) Base.deactivateQueries();
            }
        });

        $scope.$on('popupOpened', function (e, source) {
            if (angular.isDefined(source) && source != "hs.query" && angular.isDefined(popup)) popup.hide();
        });

        $scope.$on('infopanel.featureRemoved', (e, feature) => {
            remove($scope.data.features, feature)
        });

        $scope.$emit('scope_loaded', "Query");
    }]