import 'ol-popup/src/ol-popup.css';
import Popup from 'ol-popup';
import {Component} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';

@Component({
  selector: 'hs.query',
  template: require('./partials/infopanel.html'),
})
export class HsQueryComponent {
  popup = new Popup();

  constructor(
    private HsConfig: HsConfig,
    private HsQueryBaseService: HsQueryBaseService,
    private HsLayoutService: HsLayoutService,
    private HsMapService: HsMapService,
    private HsEventBusService: HsEventBusService
  ) {
    this.HsMapService.loaded().then((map) => {
      map.addOverlay(this.popup);
    });

    //add current panel queriable - activate/deactivate
    this.HsEventBusService.mainPanelChanges.subscribe((closed) => {
      if (this.HsQueryBaseService.currentPanelQueryable()) {
        if (!this.HsQueryBaseService.queryActive) {
          this.HsQueryBaseService.activateQueries();
        }
      } else {
        if (this.HsQueryBaseService.queryActive) {
          this.HsQueryBaseService.deactivateQueries();
        }
      }
    });

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
              this.popup.hide();
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
                    this.popup.getElement().className =
                      HsQueryBaseService.popupClassname;
                  } else {
                    this.popup.getElement().className = 'ol-popup';
                  }
                  this.popup.show(
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

    $scope.$on('popupOpened', (e, source) => {
      if (
        angular.isDefined(source) &&
        source != 'hs.query' &&
        this.popup !== undefined
      ) {
        this.popup.hide();
      }
    });

    $scope.$on('infopanel.featureRemoved', (e, feature) => {
      $scope.data.features.splice(this.HsQueryBaseService.data.features.indexOf(feature), 1);
    });
  }
}
