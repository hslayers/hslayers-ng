export default {
  template: ['config', (config) => {
    if (config.design == 'md') {
      return require('./partials/panelmd.html');
    } else {
      return require('./partials/panel.html');
    }
  }],
  controller: ['$scope', 'hs.map.service', 'Core', 'hs.save-map.service', 'config', '$compile', 'hs.saveMapManagerService',
    '$timeout', 'hs.layout.service', 'hs.common.laymanService',
    function ($scope, OlMap, Core, saveMapService, config, $compile, saveMapManagerService, $timeout, layoutService, commonLaymanService) {
      angular.extend($scope, {
        compoData: saveMapManagerService.compoData,
        config: config,
        endpoint: null,
        saveMapManagerService,
        step: 'start',
        selectDeselectAllLayers: saveMapManagerService.selectDeselectAllLayers,

        /**
         * Callback function for clicking Next button, create download link for map context and show save, saveas buttons
         * @function next
         * @memberof hs.save-map
         */
        next() {
          if ($scope.step == 'start') {
            $scope.step = 'access';
          } else if ($scope.step == 'access') {
            $scope.step = 'author';
          } else if ($scope.step == 'author') {
            $scope.downloadableData = 'text/json;charset=utf-8,' + encodeURIComponent(angular.toJson(saveMapService.map2json(OlMap.map, $scope.compoData, saveMapManagerService.userData, saveMapManagerService.statusData)));
            $scope.step = 'end';
          }
        },

        setStep(step) {
          $scope.step = step;
        },

        /**
         * Show dialog about result of saving operation
         * @function showResultDialog
         * @memberof hs.save-map
         */
        showResultDialog() {
          if (layoutService.contentWrapper.querySelector('.hs-status-creator-result-dialog') === null) {
            const el = angular.element('<div hs.save-map.result_dialog_directive></span>');
            $compile(el)($scope);
            layoutService.contentWrapper.querySelector('.hs-dialog-area').appendChild(el[0]);
          } else {
            $scope.resultModalVisible = true;
          }
        },

        showSaveDialog() {
          const previousDialog = layoutService.contentWrapper.querySelector('.hs-status-creator-save-dialog');
          if (previousDialog) {
            previousDialog.parentNode.removeChild(previousDialog);
          }
          const el = angular.element('<div hs.save-map.save_dialog_directive></span>');
          $compile(el)($scope);
          layoutService.contentWrapper.querySelector('.hs-dialog-area').appendChild(el[0]);
        },

        /**
         * Test if current composition can be saved (User permission, Free title of composition) and a) proceed with saving; b) display advanced save dialog; c) show result dialog, with fail message
         * @function confirmSave
         * @memberof hs.save-map
         */
        confirmSave() {
          saveMapManagerService.confirmSave();
        },

        save(saveAsNew) {
          saveMapManagerService.save(saveAsNew, $scope.endpoint);
        },

        /**
         * Callback for saving with new title
         * @function selectNewTitle
         * @memberof hs.save-map
         */
        selectNewTitle () {
          $scope.compoData.title = $scope.statusData.guessedTitle;
          $scope.changeTitle = true;
        },

        /**
         * @function focusTitle
         * @memberof hs.save-map
         */
        focusTitle () {
          if ($scope.statusData.guessedTitle) {
            $scope.compoData.title = $scope.statusData.guessedTitle;
          }
          $timeout(() => {
            layoutService.contentWrapper.querySelector('.hs-stc-title').focus();
          });
        },

        getCurrentExtent () {
          $scope.compoData.bbox = saveMapManagerService.getCurrentExtent();
        },

        isAllowed() {
          if ($scope.endpoint.type == 'statusmanager') {
            return !Core.isAuthorized();
          } else
          if ($scope.endpoint.type == 'layman') {
            return true;
          }
        }
      });

      $scope.$on('StatusManager.saveResult', (e, step, result, details) => {
        $scope.resultCode = result;
        $scope.details = details;
        if (step === 'saveResult') {
          $scope.showResultDialog();
          $scope.step = 'start';
          layoutService.setMainPanel('layermanager', true);
        } else if (step === 'saveConfirm') {
          $scope.showSaveDialog();
        } else if (step === 'saveResult') {
          $scope.showResultDialog();
        }
      });

      $scope.$on('core.map_reset', (event, data) => {
        $scope.step = 'start';
      });

      $scope.$on('core.mainpanel_changed', (event) => {
        if (layoutService.mainpanel == 'saveMap') {
          $scope.step = 'start';
        }
      });

      $scope.$on('StatusCreator.open', (e, composition) => {
        if (composition && composition.endpoint) {
          const openedType = composition.endpoint.type;
          $scope.endpoint = saveMapManagerService.endpoints
            .filter((ep) => ep.type == openedType)[0];
        }
      });

      $scope.endpointChanged = function() {
        if ($scope.endpoint.type == 'layman') {
          commonLaymanService.getCurrentUser($scope.endpoint);
        }
      };

      $scope.$watch(() => {
        return saveMapManagerService.endpoints;
      }, (value) => {
        if (value && $scope.endpoint === null && value.length > 0) {
          const laymans = value.filter(ep => ep.type == 'layman');
          if (laymans.length > 0) {
            $scope.endpoint = laymans[0];
          } else {
            $scope.endpoint = value[0];
          }
          if ($scope.endpoint && $scope.endpoint.type == 'layman') {
            commonLaymanService.getCurrentUser($scope.endpoint);
          }
        }
      });

      $scope.$emit('scope_loaded', 'StatusCreator');
    }
  ]
};
