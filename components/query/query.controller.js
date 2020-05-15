import 'ol-popup/src/ol-popup.css';
import Popup from 'ol-popup';
import {remove} from 'lodash';

export default [
  '$scope',
  '$rootScope',
  '$timeout',
  'HsMapService',
  'HsQueryBaseService',
  'HsQueryWmsService',
  'HsQueryVectorService',
  'HsCore',
  'HsConfig',
  'HsLayoutService',
  '$injector',
  function (
    $scope,
    $rootScope,
    $timeout,
    OlMap,
    Base,
    WMS,
    Vector,
    HsCore,
    config,
    layoutService,
    $injector
  ) {
    const popup = new Popup();

    OlMap.loaded().then((map) => {
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
            template: require('components/query/partials/infopanel.html'),
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

    $scope.data = Base.data;

    const deregisterQueryStatusChanged = $rootScope.$on(
      'queryStatusChanged',
      () => {
        if (Base.queryActive) {
          $scope.deregisterVectorQuery = $scope.$on('mapQueryStarted', (e) => {
            if (config.design === 'md' && $scope.data.features.length === 0) {
              $scope.showNoImagesWarning();
            }
            if (config.design === 'md' && $scope.data.features.length > 0) {
              $scope.showQueryDialog(e);
            } else {
              popup.hide();
              if (Base.currentPanelQueryable()) {
                layoutService.setMainPanel('info');
              }
            }
          });

          $scope.deregisterWmsQuery = $scope.$on(
            'queryWmsResult',
            (e, coordinate) => {
              $timeout(() => {
                const invisiblePopup = Base.getInvisiblePopup();
                if (invisiblePopup.contentDocument.body.children.length > 0) {
                  //TODO: dont count style, title, meta towards length
                  if (Base.popupClassname.length > 0) {
                    popup.getElement().className = Base.popupClassname;
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
    $scope.$on('core.mainpanel_changed', (event, closed) => {
      if (Base.currentPanelQueryable()) {
        if (!Base.queryActive) {
          Base.activateQueries();
        }
      } else {
        if (Base.queryActive) {
          Base.deactivateQueries();
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
      remove($scope.data.features, feature);
    });

    $scope.$emit('scope_loaded', 'Query');
  },
];
