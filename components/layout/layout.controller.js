export default [
  '$scope',
  '$injector',
  '$rootScope',
  '$window',
  'Core',
  'hs.map.service',
  'hs.geolocation.service',
  'hs.layermanager.service',
  'config',
  '$timeout',
  'hs.layout.service',
  '$log',
  '$document',
  function (
    $scope,
    $injector,
    $rootScope,
    $window,
    Core,
    OlMap,
    Geolocation,
    LayerManager,
    config,
    $timeout,
    layoutService,
    $log,
    $document
  ) {
    if (config.design == 'md') {
      require([
        'angular-material-bottom-sheet-collapsible/bottomSheetCollapsible',
      ]);
    }
    $scope.config = config;
    $scope.importCss = angular.isDefined(config.importCss)
      ? config.importCss
      : true;
    $scope.useIsolatedBootstrap = angular.isDefined(config.useIsolatedBootstrap)
      ? config.useIsolatedBootstrap
      : false;
    $scope.Core = Core;
    $scope.geolocation = Geolocation;
    $scope.LM = LayerManager;
    $scope.layoutService = layoutService;
    $scope.panelVisible = layoutService.panelVisible;
    $scope.panelEnabled = layoutService.panelEnabled;

    $scope.location = {
      status: {
        icon: 'location_searching',
        class: 'off',
      },
    };
    $scope.defaultFab = {
      primary: {
        clickAction: function () {
          $log.log('Primary clicked.');
        },
        classes: '',
        icon: {
          iconSet: 'material-icons',
          classes: '',
          text: 'add',
        },
        tooltip: {
          direction: 'left',
          text: 'Cancel',
        },
      },
      secondary: [
        {
          clickAction: function () {
            $log.log('Secondary 1 clicked.');
          },
          classes: '',
          icon: {
            iconSet: 'material-icons',
            classes: '',
            text: 'place',
          },
          tooltip: {
            direction: 'left',
            text: 'New point',
          },
        },
        {
          clickAction: function () {
            $log.log('Secondary 2 clicked.');
          },
          classes: '',
          icon: {
            iconSet: 'material-icons',
            classes: '',
            text: 'timeline',
          },
          tooltip: {
            direction: 'left',
            text: 'New line',
          },
        },
        {
          clickAction: function () {
            $log.log('Secondary 3 clicked.');
          },
          classes: '',
          icon: {
            iconSet: 'material-icons',
            classes: '',
            text: 'select_all',
          },
          tooltip: {
            direction: 'left',
            text: 'New polygon',
          },
        },
      ],
      options: {
        isOpen: false,
        tooltipsVisible: false,
        direction: 'up',
        location: 'md-fab-bottom-right',
      },
    };

    $scope.fab = {
      update: function (primary, secondary, options) {
        this.primary = angular.copy(primary);
        if (secondary) {
          this.secondary = angular.copy(secondary);
        } else if (this.secondary) {
          delete this.secondary;
        }
        this.options = angular.copy(options);
      },
      unset: function () {
        this.primary = angular.copy($scope.defaultFab.primary);
        this.secondary = $scope.defaultFab.secondary
          ? angular.copy($scope.defaultFab.secondary)
          : undefined;
        this.options = angular.copy($scope.defaultFab.options);
      },
    };

    $scope.$watch('fab.options.isOpen', (isOpen) => {
      if (isOpen) {
        $scope.showTooltips = $timeout(() => {
          $scope.fab.options.tooltipsVisible = $scope.fab.options.isOpen;
          $scope.hideTooltips = $timeout(() => {
            $scope.fab.options.tooltipsVisible = false;
          }, 2500);
        }, 500);
      } else {
        $timeout.cancel($scope.showTooltips);
        $timeout.cancel($scope.hideTooltips);
        $scope.fab.options.tooltipsVisible = $scope.fab.options.isOpen;
      }
    });

    $scope.$on('scope_loaded', () => {
      $scope.fab.unset();
    });

    /**
     * Remove loading logo which is used in cordova applications
     */
    function removeLoadingLogo() {
      const el = $document[0].getElementById('hs-loading-logo');
      if (el) {
        el.parentElement.removeChild(el);
      }
    }

    const unregisterViewContentLoaded = $rootScope.$on(
      '$viewContentLoaded',
      removeLoadingLogo
    );

    $timeout(removeLoadingLogo, 100);

    $scope.leftSidenavOpen = false;

    const unregisterGeolocationStarted = $rootScope.$on(
      'geolocation.started',
      () => {
        $scope.location.status.icon = 'my_location';
        $scope.location.status.class = 'searching';
      }
    );

    const unregisterGeolocationUpdated = $rootScope.$on(
      'geolocation.updated',
      () => {
        $scope.location.status.icon = 'my_location';
        $scope.location.status.class = 'on';
      }
    );

    const unregisterGeolocationStoped = $rootScope.$on(
      'geolocation.stopped',
      () => {
        $scope.location.status.icon = 'location_searching';
        $scope.location.status.class = 'off';
      }
    );

    const unregisterGeolocationFailed = $rootScope.$on(
      'geolocation.failed',
      () => {
        $scope.location.status.icon = 'location_disabled';
        $scope.location.status.class = 'off';
      }
    );

    $scope.$on('$destroy', () => {
      unregisterGeolocationStarted();
      unregisterGeolocationUpdated();
      unregisterGeolocationStoped();
      unregisterGeolocationFailed();
      unregisterViewContentLoaded();
    });

    let $mdMedia;
    try {
      $mdMedia = $injector.get('$mdMedia');
    } catch (ex) {
      //Disregard exception
    }
    $scope.openPanel = function (panel) {
      layoutService.setMainPanel(panel.name);
      $scope.bottomSheetTitle = panel.title;
      if ($mdMedia && !$mdMedia('gt-sm') && !$scope.getBottomSheetState) {
        $scope.closeLeftSidenav();
        $scope.openBottomSheet(panel);
      }
    };

    $scope.switchBottomSheetState = function () {
      if ($scope.getBottomSheetState() === 'minimized') {
        $scope.setHalfway();
      } else {
        $scope.setMinimized();
      }
    };

    // $scope.bottomSheetState = "halfway";
    // $scope.bottomSheetSwitchStateIcon = "expand_more";

    $scope.openBottomSheet = function (panel) {
      try {
        const $mdBottomSheetCollapsible = $injector.get(
          '$mdBottomSheetCollapsible'
        );
        $mdBottomSheetCollapsible
          .show({
            template: require('./partials/bottom-sheet.html'),
            scope: $scope,
            parent: layoutService.layoutElement,
            preserveScope: true,
            disableBackdrop: true,
            // disableParentScroll: false,
            clickOutsideToClose: true,
            onLoad: function (e) {
              $scope.setMinimized = e.setMinimized;
              $scope.setHalfway = e.setHalfway;
              $scope.setExpanded = e.setExpanded;
              $scope.getBottomSheetState = e.getState;
              $scope.bottomSheet = e.element;
              // () => {
              //     var raw = $scope.bottomSheet;
              //     $scope.$watch(() => raw.scrollHeight,
              //         resolveScrollPosition(raw));
              //     $scope.$watch(() => $scope.getBottomSheetState(), resolveScrollPosition(raw));
              //     element.bind('scroll', function () {
              //         raw.style["touch-action"] = "pan-y";
              //         if (raw.scrollTop + raw.offsetHeight > raw.scrollHeight) {
              //             raw.style["touch-action"] = "pan-up";
              //         }
              //         if (raw.scrollTop == 0) {
              //             raw.style["touch-action"] = "pan-down";
              //         }
              //     })
              // }
            },
          })
          .then((e) => {
            $log.log('Bottom sheet closed', Date.now());
            $scope.unsetBottomSheet();
          })
          .catch((e) => {
            $log.log('Bottom sheet canceled', Date.now());
            $scope.unsetBottomSheet();
          });
      } catch (e) {
        $log.log('Injector does not have mdBottomSheetCollapsible service!');
      }

      // $scope.$watch(function() {
      //     return $scope.getBottomSheetState();
      // }, function() {
      //     $scope.bottomSheetSwitchStateIcon = $scope.getBottomSheetState === "minimized" ? "expand_less" : "expand_more";
      // });
    };

    $scope.closeBottomSheet = function () {
      $scope.bottomSheet.hide();
      $scope.unsetBottomSheet();
    };

    $scope.unsetBottomSheet = function () {
      $scope.setMinimized = undefined;
      $scope.setHalfway = undefined;
      $scope.setExpanded = undefined;
      $scope.getBottomSheetState = undefined;
      $scope.bottomSheet = undefined;
    };
    if (config.design == 'md') {
      try {
        const $mdSidenav = $injector.get('$mdSidenav');

        $scope.openLeftSidenav = function () {
          $mdSidenav('sidenav-left')
            .open()
            .then(() => {
              $scope.leftSidenavOpen = true;
            });
        };

        $scope.closeLeftSidenav = function () {
          $mdSidenav('sidenav-left').close();
        };

        $mdSidenav('sidenav-left', true).then(() => {
          const Hammer = require('hammerjs');
          $mdSidenav('sidenav-left').onClose(() => {
            $scope.leftSidenavOpen = false;
          });

          Hammer($document[0].getElementsByClassName('md-sidenav-left')[0]).on(
            'swipeleft',
            () => {
              $scope.closeLeftSidenav();
            }
          );

          Hammer(
            layoutService.contentWrapper.querySelector('.sidenav-swipe-overlay')
          ).on('swiperight', () => {
            $scope.openLeftSidenav();
          });
        });

        $scope.openRightPanel = function () {
          $mdSidenav('right-panel')
            .open()
            .then(() => {
              $scope.rightPanelOpen = true;
            });
        };

        $scope.closeRightPanel = function () {
          $mdSidenav('right-panel').close();
        };

        $mdSidenav('right-panel', true).then(() => {
          $mdSidenav('right-panel').onClose(() => {
            $scope.rightPanelOpen = false;
          });
        });
      } catch (ex) {
        $log.error('$mdSidenav missing');
      }

      try {
        const $mdDialog = $injector.get('$mdDialog');

        $scope.showRemoveDialog = function (e, layer) {
          const confirm = $mdDialog
            .confirm()
            .title('Remove basemap ' + layer.title)
            .textContent('Are you sure about layer removal?')
            .ariaLabel('Confirm layer removal')
            .targetEvent(e)
            .ok('Remove')
            .cancel('Cancel')
            .hasBackdrop(false);

          $mdDialog.show(confirm).then(
            () => {
              $scope.removeLayer(layer);
            },
            () => {}
          );
        };
      } catch (ex) {
        //Ignore error
      }
    }

    $scope.defaultBaselayerThumbnail = require('../../img/default.png');
    $scope.defaultTerrainlayerThumbnail = require('../../img/default.png');

    $scope.removeLayer = function (layer) {
      const active = layer.active;
      OlMap.map.removeLayer(layer.layer);
      if (active) {
        if (LayerManager.data.baselayers.length > 0) {
          LayerManager.changeBaseLayerVisibility(
            true,
            LayerManager.data.baselayers[0]
          );
        }
      }
    };

    $scope.hasImage = function (layer) {
      return angular.isDefined(layer.layer.get('img')) ? true : false;
    };

    $scope.getImage = function (layer) {
      return layer.layer.get('img');
    };

    $scope.isRemovable = function (layer) {
      return layer.layer.get('removable');
    };

    try {
      const $mdPanel = $injector.get('$mdPanel');

      $scope.openBaselayersPanel = function ($event) {
        const panelPosition = $mdPanel
          .newPanelPosition()
          // .relativeTo($event.srcElement)
          .relativeTo($event.target)
          .addPanelPosition(
            $mdPanel.xPosition.ALIGN_END,
            $mdPanel.yPosition.ALIGN_TOPS
          )
          .addPanelPosition(
            $mdPanel.xPosition.ALIGN_START,
            $mdPanel.yPosition.ALIGN_TOPS
          )
          .addPanelPosition(
            $mdPanel.xPosition.ALIGN_END,
            $mdPanel.yPosition.ALIGN_BOTTOMS
          )
          .addPanelPosition(
            $mdPanel.xPosition.ALIGN_START,
            $mdPanel.yPosition.ALIGN_BOTTOMS
          );
        const panelAnimation = $mdPanel
          .newPanelAnimation()
          .openFrom($event.target)
          .closeTo($event.target)
          // .targetEvent($event)
          // .defaultAnimation('md-panel-animate-fly')
          .withAnimation($mdPanel.animation.SCALE);
        const config = {
          attachTo: angular.element('#gui'),
          position: panelPosition,
          animation: panelAnimation,
          targetEvent: $event,
          template: require('./partials/baselayers.html'),
          panelClass: 'baselayers-panel md-whiteframe-8dp',
          scope: this,
          trapFocus: true,
          clickOutsideToClose: true,
          clickEscapeToClose: true,
          zIndex: 50,
        };

        $mdPanel.open(config).then((result) => {});

        $scope.closeBaselayersPanel = function (MdPanelRef) {
          if (MdPanelRef) {
            MdPanelRef.close();
          }
        };
      };
    } catch (ex) {
      //Ignore error
    }

    $scope.panelSpaceWidth = layoutService.panelSpaceWidth;

    $scope.infoContainerStyle = function () {
      if (layoutService.sidebarBottom()) {
        return {
          width: layoutService.widthWithoutPanelSpace(),
          bottom: layoutService.panelSpaceHeight() + 'px',
        };
      } else {
        if (!layoutService.sidebarRight) {
          return {
            marginLeft: layoutService.panelSpaceWidth() + 'px',
            width: layoutService.widthWithoutPanelSpace(),
          };
        } else {
          return {
            marginRight: layoutService.panelSpaceWidth() + 'px',
            width: layoutService.widthWithoutPanelSpace(),
          };
        }
      }
    };

    $scope.mapStyle = () => {
      if (!OlMap.map) {
        return {};
      }
      const fullscreen =
        angular.isUndefined(config.sizeMode) || config.sizeMode == 'fullscreen';
      let height = layoutService.layoutElement.clientHeight;
      let width = layoutService.layoutElement.clientWidth;
      let marginLeft = 0;

      OlMap.map.updateSize();

      if (!layoutService.sidebarBottom() || !fullscreen) {
        marginLeft += layoutService.sidebarRight
          ? 0
          : layoutService.panelSpaceWidth();
        width -= layoutService.panelSpaceWidth();
      }

      if (
        layoutService.sidebarBottom() &&
        (fullscreen || $window.innerWidth <= 767)
      ) {
        height -= layoutService.panelSpaceHeight();
        width = layoutService.panelSpaceWidth();
      }

      height -= layoutService.mdToolbarHeight();

      return {
        height: `${height}px`,
        width: `${width}px`,
        ...(marginLeft > 0 && {marginLeft: `${marginLeft}px`}),
      };
    };

    $scope.onlyEnabled = function (item) {
      return typeof item.enabled == 'function' ? item.enabled() : item.enabled;
    };

    $scope.$emit('scope_loaded', 'Layout');
  },
];
