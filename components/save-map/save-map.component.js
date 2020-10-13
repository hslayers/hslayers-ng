export default {
  template: (HsConfig) => {
    'ngInject';
    if (HsConfig.design == 'md') {
      return require('./partials/panelmd.html');
    } else {
      return require('./partials/panel.html');
    }
  },
  controller: function (
    $scope,
    HsMapService,
    HsCore,
    HsSaveMapService,
    HsConfig,
    $compile,
    HsSaveMapManagerService,
    $timeout,
    HsLayoutService,
    HsCommonLaymanService,
    HsCommonEndpointsService,
    gettext
  ) {
    'ngInject';
    angular.extend($scope, {
      compoData: HsSaveMapManagerService.compoData,
      config: HsConfig,
      endpoint: null,
      saveMapManagerService: HsSaveMapManagerService,
      step: 'context',
      selectDeselectAllLayers: HsSaveMapManagerService.selectDeselectAllLayers,
      endpointsService: HsCommonEndpointsService,
      overwrite: false,
      gettext,
      steps: ['context', 'access', 'author'],

      /**
       * Callback function for clicking Next button, create download link for map context and show save, saveas buttons
       *
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
                HsSaveMapService.map2json(
                  HsMapService.map,
                  $scope.compoData,
                  HsSaveMapManagerService.userData,
                  HsSaveMapManagerService.statusData
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
       *
       * @function showResultDialog
       * @memberof hs.save-map
       */
      showResultDialog() {
        if (
          HsLayoutService.contentWrapper.querySelector(
            '.hs-status-creator-result-dialog'
          ) === null
        ) {
          const el = angular.element(
            '<div hs.save-map.result_dialog_directive></span>'
          );
          $compile(el)($scope);
          HsLayoutService.contentWrapper
            .querySelector('.hs-dialog-area')
            .appendChild(el[0]);
        } else {
          $scope.resultModalVisible = true;
        }
      },

      showSaveDialog() {
        const previousDialog = HsLayoutService.contentWrapper.querySelector(
          '.hs-status-creator-save-dialog'
        );
        if (previousDialog) {
          previousDialog.parentNode.removeChild(previousDialog);
        }
        const el = angular.element(
          '<div hs.save-map.save_dialog_directive></span>'
        );
        $compile(el)($scope);
        HsLayoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
      },

      /**
       * Test if current composition can be saved (User permission, Free title of composition) and a) proceed with saving; b) display advanced save dialog; c) show result dialog, with fail message
       *
       * @function confirmSave
       * @memberof hs.save-map
       */
      confirmSave() {
        HsSaveMapManagerService.confirmSave().then(() => {
          $scope.showSaveDialog();
        });
      },

      save(saveAsNew) {
        HsSaveMapManagerService.save(saveAsNew, $scope.endpoint)
          .then($scope.processSaveCallback)
          .catch($scope.processSaveCallback);
      },

      processSaveCallback(response) {
        HsSaveMapManagerService.statusData.status = response.status;
        if (!response.status) {
          HsSaveMapManagerService.statusData.resultCode = response.error
            ? 'error'
            : 'not-saved';
          if (response.error.code == 24) {
            $scope.overwrite = true;
          }
          HsSaveMapManagerService.statusData.error = response.error;
        } else {
          $scope.step = 'context';
          HsLayoutService.setMainPanel('layermanager', true);
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
       *
       * @function selectNewTitle
       * @memberof hs.save-map
       */
      selectNewTitle() {
        $scope.compoData.title =
          HsSaveMapManagerService.statusData.guessedTitle;
        $scope.changeTitle = true;
      },

      /**
       * @function focusTitle
       * @memberof hs.save-map
       */
      focusTitle() {
        if (HsSaveMapManagerService.statusData.guessedTitle) {
          $scope.compoData.title =
            HsSaveMapManagerService.statusData.guessedTitle;
        }
        $timeout(() => {
          HsLayoutService.contentWrapper.querySelector('.hs-stc-title').focus();
        });
      },

      getCurrentExtent() {
        $scope.compoData.bbox = HsSaveMapManagerService.getCurrentExtent();
      },

      isAllowed() {
        if ($scope.endpoint === null) {
          return false;
        }
        if ($scope.endpoint.type == 'statusmanager') {
          return !HsCore.isAuthorized();
        } else if ($scope.endpoint.type == 'layman') {
          return (
            $scope.endpoint.user == 'anonymous' ||
            $scope.endpoint.user == 'browser'
          );
        }
      },
    });

    $scope.$on('core.map_reset', (event, data) => {
      $scope.step = 'context';
    });

    $scope.$on('core.mainpanel_changed', (event) => {
      if (HsLayoutService.mainpanel == 'saveMap') {
        $scope.step = 'context';
      }
    });

    $scope.$on('StatusCreator.open', (e, composition) => {
      if (composition && composition.endpoint) {
        const openedType = composition.endpoint.type;
        $scope.endpoint = HsCommonEndpointsService.endpoints.filter(
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
        return HsCommonEndpointsService.endpoints;
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
            HsCommonLaymanService.getCurrentUser($scope.endpoint);
          }
        }
      }
    );

    $scope.$emit('scope_loaded', 'StatusCreator');
  },
};
