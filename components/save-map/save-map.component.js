export default {
    template: ['config', (config) => {
        if (config.design == 'md')
            return require('components/save-map/partials/panelmd.html')
        else
            return require('components/save-map/partials/panel.html')
    }],
    controller: ['$scope', 'hs.map.service', 'Core', 'hs.save-map.service', 'config', '$compile', 'hs.saveMapManagerService', 'hs.layerSynchronizerService',
        '$timeout', 'hs.layout.service',
        function ($scope, OlMap, Core, saveMap, config, $compile, StatusManager, $timeout, layerSynchronizerService, layoutService) {
            $scope.compoData = StatusManager.compoData;
            $scope.statusData = StatusManager.statusData;
            $scope.userData = StatusManager.userData;
            $scope.config = config;
            $scope.endpoint = StatusManager.endpoints[0];
            $scope.endpoints = StatusManager.endpoints;
            $scope.step = 'start'; //Possible values: start,
            $scope.selectDeselectAllLayers = StatusManager.selectDeselectAllLayers;
            /**
             * Callback function for clicking Next button, create download link for map context and show save, saveas buttons
             * @function next
             * @memberof hs.save-map
             */
            $scope.next = function () {
                if ($scope.step == 'start')
                    $scope.step = 'access';
                else if ($scope.step == 'access')
                    $scope.step = 'author';
                else if ($scope.step == 'author') {
                    $scope.downloadableData = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(saveMap.map2json(OlMap.map, $scope.compoData, $scope.userData, $scope.statusData)));
                    $scope.step = 'end';
                }
            }
            $scope.setStep = function (step) {
                $scope.step = step;
            }
            /**
             * Show dialog about result of saving operation
             * @function showResultDialog
             * @memberof hs.save-map
             */
            $scope.showResultDialog = function () {
                if (document.getElementById("status-creator-result-dialog") == null) {
                    var el = angular.element('<div hs.save-map.result_dialog_directive></span>');
                    $compile(el)($scope);
                    document.getElementById("hs-dialog-area").appendChild(el[0]);
                } else {
                    $scope.resultModalVisible = true;
                }
            }

            $scope.showSaveDialog = function () {
                var previousDialog = document.getElementById("status-creator-save-dialog");
                if (previousDialog)
                    previousDialog.parentNode.removeChild(previousDialog);
                var el = angular.element('<div hs.save-map.save_dialog_directive></span>');
                $compile(el)($scope);
                document.getElementById("hs-dialog-area").appendChild(el[0]);
            }
            /**
             * Test if current composition can be saved (User permission, Free title of composition) and a) proceed with saving; b) display advanced save dialog; c) show result dialog, with fail message
             * @function confirmSave
             * @memberof hs.save-map
             */
            $scope.confirmSave = function () {
                StatusManager.confirmSave();
            }

            $scope.save = function (saveAsNew) {
                StatusManager.save(saveAsNew, $scope.endpoint);
            }

            $scope.$on('StatusManager.saveResult', function (e, step, result, details) {
                $scope.resultCode = result;
                $scope.details = details;
                if (step === 'saveResult') {
                    $scope.showResultDialog();
                    $scope.step = 'start';
                    layoutService.setMainPanel('layermanager', true);
                }
                else if (step === 'saveConfirm') {
                    $scope.showSaveDialog();
                }
                else if (step === 'saveResult') {
                    $scope.showResultDialog();
                }
            })

            /**
             * Callback for saving with new title 
             * @function selectNewTitle
             * @memberof hs.save-map
             */
            $scope.selectNewTitle = function () {
                $scope.compoData.title = $scope.statusData.guessedTitle;
                $scope.changeTitle = true;
            }
            /**
             * @function focusTitle
             * @memberof hs.save-map
             */
            $scope.focusTitle = function () {
                if ($scope.statusData.guessedTitle) {
                    $scope.compoData.title = $scope.statusData.guessedTitle;
                }
                $timeout(() => {
                    document.getElementById('hs-stc-title').focus();
                });
            };

            $scope.getCurrentExtent = function () {
                $scope.compoData.bbox = StatusManager.getCurrentExtent();
            }

            $scope.$on('core.map_reset', function (event, data) {
                $scope.step = 'start';
            });

            $scope.$on('core.mainpanel_changed', function (event) {
                if (layoutService.mainpanel == 'saveMap') {
                    $scope.step = 'start';
                }
            });

            $scope.isAllowed = function () {
                if ($scope.endpoint.type == 'statusmanager')
                    return !Core.isAuthorized()
                else
                    if ($scope.endpoint.type == 'layman')
                        return true;
            }

            $scope.$on('StatusCreator.open', function (e, composition) {
                if (composition && composition.endpoint) {
                    var openedType = composition.endpoint.type;
                    $scope.endpoint = StatusManager.endpoints
                        .filter((ep) => ep.type == openedType)[0]
                }
            });

            $scope.$emit('scope_loaded', "StatusCreator");
        }
    ]
}