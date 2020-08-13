import 'ol-popup/src/ol-popup.css';
import Popup from 'ol-popup';

/**
 * @param $scope
 * @param $rootScope
 * @param $timeout
 * @param HsMapService
 * @param HsQueryBaseService
 * @param HsConfig
 * @param HsLayoutService
 * @param HsEventBusService
 * @param $injector
 */
export default function (
  $scope,
  $rootScope,
  $timeout,
  HsMapService,
  HsQueryBaseService,
  HsConfig,
  HsLayoutService,
  HsEventBusService,
  $injector
) {
  'ngInject';
  const popup = new Popup();

  HsMapService.loaded().then((map) => {
    map.addOverlay(popup);
  });

  try {
    const $mdDialog = $injector.get('$mdDialog');
    const $mdToast = $injector.get('$mdToast');

    $scope.showQueryDialog = function (ev) {
      $mdDialog
        .show({
          scope: this,
          preserveScope: true,
          template: require('./partials/infopanel.html'),
          parent: angular.element(document.body),
          targetEvent: ev,
          clickOutsideToClose: true,
        })
        .then(
          () => {
            console.log('Closed.');
          },
          () => {
            console.log('Cancelled.');
          }
        );
    };

    $scope.cancelQueryDialog = function () {
      $mdDialog.cancel();
    };

    $scope.showNoImagesWarning = function () {
      $mdToast.show(
        $mdToast.simple().textContent('No images matched the query.')
        // .position(pinTo )
        // .hideDelay(3000)
      );
    };
  } catch (ex) {}

  $scope.data = HsQueryBaseService.data;

  const deregisterQueryStatusChanged = $rootScope.$on(
    'queryStatusChanged',
    () => {
      if (HsQueryBaseService.queryActive) {
        $scope.deregisterVectorQuery = $scope.$on('mapQueryStarted', (e) => {
          if (HsConfig.design === 'md' && $scope.data.features.length === 0) {
            $scope.showNoImagesWarning();
          }
          if (HsConfig.design === 'md' && $scope.data.features.length > 0) {
            $scope.showQueryDialog(e);
          } else {
            popup.hide();
            if (HsQueryBaseService.currentPanelQueryable()) {
              HsLayoutService.setMainPanel('info');
            }
          }
        });

        $scope.deregisterWmsQuery = $scope.$on(
          'queryWmsResult',
          (e, coordinate) => {
            $timeout(() => {
              const invisiblePopup = HsQueryBaseService.getInvisiblePopup();
              if (invisiblePopup.contentDocument.body.children.length > 0) {
                //TODO: dont count style, title, meta towards length
                if (HsQueryBaseService.popupClassname.length > 0) {
                  popup.getElement().className =
                    HsQueryBaseService.popupClassname;
                } else {
                  popup.getElement().className = 'ol-popup';
                }
                popup.show(
                  coordinate,
                  invisiblePopup.contentDocument.body.innerHTML
                );
                $rootScope.$broadcast('popupOpened', 'hs.query');
              }
            });
          }
        );
      } else {
        if ($scope.deregisterVectorQuery) {
          $scope.deregisterVectorQuery();
        }
        if ($scope.deregisterWmsQuery) {
          $scope.deregisterWmsQuery();
        }
      }
    }
  );
  $scope.$on('$destroy', () => {
    if (deregisterQueryStatusChanged) {
      deregisterQueryStatusChanged();
    }
  });

  $scope.$on('queryVectorResult', () => {
    $timeout(() => {}, 0);
  });

  //add current panel queriable - activate/deactivate
  HsEventBusService.mainPanelChanges.subscribe((closed) => {
    if (HsQueryBaseService.currentPanelQueryable()) {
      if (!HsQueryBaseService.queryActive) {
        HsQueryBaseService.activateQueries();
      }
    } else {
      if (HsQueryBaseService.queryActive) {
        HsQueryBaseService.deactivateQueries();
      }
    }
  });

  $scope.$on('popupOpened', (e, source) => {
    if (
      angular.isDefined(source) &&
      source != 'hs.query' &&
      angular.isDefined(popup)
    ) {
      popup.hide();
    }
  });

  $scope.$on('infopanel.featureRemoved', (e, feature) => {
    $scope.data.features.splice($scope.data.features.indexOf(feature), 1);
  });

  $scope.$emit('scope_loaded', 'Query');
}
