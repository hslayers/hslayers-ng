export default {
  template: [
    'config',
    (config) => {
      if (config.design == 'md') {
        return require('./partials/panelmd.html');
      } else {
        return require('./partials/panel.html');
      }
    },
  ],
  controller: [
    '$scope',
    'hs.map.service',
    'Core',
    'hs.save-map.service',
    'config',
    '$compile',
    'hs.saveMapManagerService',
    '$timeout',
    'hs.layout.service',
    'hs.common.laymanService',
    'hs.common.endpointsService',
    'gettext',
    function (
      $scope,
      OlMap,
      Core,
      saveMapService,
      config,
      $compile,
      saveMapManagerService,
      $timeout,
      layoutService,
      commonLaymanService,
      endpointsService,
      gettext
    ) {
      angular.extend($scope, {
        compoData: saveMapManagerService.compoData,
        config: config,
        endpoint: null,
        saveMapManagerService,
        step: 'context',
        selectDeselectAllLayers: saveMapManagerService.selectDeselectAllLayers,
        endpointsService,
        overwrite: false,
        gettext,
        steps: ['context', 'access', 'author'],

        /**
         * Callback function for clicking Next button, create download link for map context and show save, saveas buttons
         * @function next
         * @memberof hs.save-map
         */
        next() {
          const ixCurrent = $scope.steps.indexOf($scope.step);
          if ($scope.steps.length > ixCurrent + 1) {
            $scope.step = $scope.steps[ixCurrent + 1];
          } else {
            $scope.step = 'end';
            $scope.downloadableData =
              'text/json;charset=utf-8,' +
              encodeURIComponent(
                angular.toJson(
                  saveMapService.map2json(
                    OlMap.map,
                    $scope.compoData,
                    saveMapManagerService.userData,
                    saveMapManagerService.statusData
                  )
                )
              );
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
          if (
            layoutService.contentWrapper.querySelector(
              '.hs-status-creator-result-dialog'
            ) === null
          ) {
            const el = angular.element(
              '<div hs.save-map.result_dialog_directive></span>'
            );
            $compile(el)($scope);
            layoutService.contentWrapper
              .querySelector('.hs-dialog-area')
              .appendChild(el[0]);
          } else {
            $scope.resultModalVisible = true;
          }
        },

        showSaveDialog() {
          const previousDialog = layoutService.contentWrapper.querySelector(
            '.hs-status-creator-save-dialog'
          );
          if (previousDialog) {
            previousDialog.parentNode.removeChild(previousDialog);
          }
          const el = angular.element(
            '<div hs.save-map.save_dialog_directive></span>'
          );
          $compile(el)($scope);
          layoutService.contentWrapper
            .querySelector('.hs-dialog-area')
            .appendChild(el[0]);
        },

        /**
         * Test if current composition can be saved (User permission, Free title of composition) and a) proceed with saving; b) display advanced save dialog; c) show result dialog, with fail message
         * @function confirmSave
         * @memberof hs.save-map
         */
        confirmSave() {
          saveMapManagerService.confirmSave().then(() => {
            $scope.showSaveDialog();
          });
        },

        save(saveAsNew) {
          saveMapManagerService
            .save(saveAsNew, $scope.endpoint)
            .then($scope.processSaveCallback)
            .catch($scope.processSaveCallback);
        },

        processSaveCallback(response) {
          saveMapManagerService.statusData.status = response.status;
          if (!response.status) {
            saveMapManagerService.statusData.resultCode = response.error
              ? 'error'
              : 'not-saved';
            if (response.error.code == 24) {
              $scope.overwrite = true;
            }
            saveMapManagerService.statusData.error = response.error;
          } else {
            $scope.step = 'context';
            layoutService.setMainPanel('layermanager', true);
          }
          $timeout((_) => {
            $scope.showResultDialog();
          }, 0);
        },

        titleChanged() {
          $scope.overwrite = false;
        },

        /**
         * Callback for saving with new title
         * @function selectNewTitle
         * @memberof hs.save-map
         */
        selectNewTitle() {
          $scope.compoData.title =
            saveMapManagerService.statusData.guessedTitle;
          $scope.changeTitle = true;
        },

        /**
         * @function focusTitle
         * @memberof hs.save-map
         */
        focusTitle() {
          if (saveMapManagerService.statusData.guessedTitle) {
            $scope.compoData.title =
              saveMapManagerService.statusData.guessedTitle;
          }
          $timeout(() => {
            layoutService.contentWrapper.querySelector('.hs-stc-title').focus();
          });
        },

        getCurrentExtent() {
          $scope.compoData.bbox = saveMapManagerService.getCurrentExtent();
        },

        isAllowed() {
          if ($scope.endpoint === null) {
            return false;
          }
          if ($scope.endpoint.type == 'statusmanager') {
            return !Core.isAuthorized();
          } else if ($scope.endpoint.type == 'layman') {
            return true;
          }
        },
      });

      $scope.$on('core.map_reset', (event, data) => {
        $scope.step = 'context';
      });

      $scope.$on('core.mainpanel_changed', (event) => {
        if (layoutService.mainpanel == 'saveMap') {
          $scope.step = 'context';
        }
      });

      $scope.$on('StatusCreator.open', (e, composition) => {
        if (composition && composition.endpoint) {
          const openedType = composition.endpoint.type;
          $scope.endpoint = endpointsService.endpoints.filter(
            (ep) => ep.type == openedType
          )[0];
        }
      });

      $scope.endpointChanged = function () {
        if ($scope.endpoint) {
          if ($scope.endpoint.getCurrentUserIfNeeded) {
            $scope.endpoint.getCurrentUserIfNeeded();
          }
          switch ($scope.endpoint.type) {
            case 'layman':
              $scope.steps = ['context', 'author'];
              break;
            default:
              $scope.steps = ['context', 'access', 'author'];
          }
        }
      };

      $scope.$watch(
        () => {
          return endpointsService.endpoints;
        },
        (value) => {
          if (value && $scope.endpoint === null && value.length > 0) {
            const laymans = value.filter((ep) => ep.type == 'layman');
            if (laymans.length > 0) {
              $scope.endpoint = laymans[0];
              $scope.endpointChanged();
            } else {
              $scope.endpoint = value[0];
              $scope.endpointChanged();
            }
            if ($scope.endpoint && $scope.endpoint.type == 'layman') {
              commonLaymanService.getCurrentUser($scope.endpoint);
            }
          }
        }
      );

      $scope.$emit('scope_loaded', 'StatusCreator');
    },
  ],
};
