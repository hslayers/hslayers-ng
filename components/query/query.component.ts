import 'ol-popup/src/ol-popup.css';
import Popup from 'ol-popup';
import {Component} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';

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

    try {
      this.$mdDialog = $injector.get('$mdDialog');
      this.$mdToast = $injector.get('$mdToast');
    } catch (ex) {}

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
        $scope.$on('mapQueryStarted', (e) => {
          if (
            HsConfig.design === 'md' &&
            this.HsQueryBaseService.data.features.length === 0
          ) {
            this.showNoImagesWarning();
          }
          if (
            HsConfig.design === 'md' &&
            this.HsQueryBaseService.data.features.length > 0
          ) {
            this.showQueryDialog(e);
          } else {
            this.popup.hide();
            if (this.HsQueryBaseService.currentPanelQueryable()) {
              this.HsLayoutService.setMainPanel('info');
            }
          }
        });

        $scope.deregisterWmsQuery = $scope.$on(
          'queryWmsResult',
          (e, coordinate) => {
            $timeout(() => {
              const invisiblePopup = this.HsQueryBaseService.getInvisiblePopup();
              if (invisiblePopup.contentDocument.body.children.length > 0) {
                //TODO: dont count style, title, meta towards length
                if (this.HsQueryBaseService.popupClassname.length > 0) {
                  this.popup.getElement().className = this.HsQueryBaseService.popupClassname;
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
      this.HsQueryBaseService.data.features.splice(
        this.HsQueryBaseService.data.features.indexOf(feature),
        1
      );
    });
  }

  showQueryDialog(ev) {
    this.$mdDialog
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
  }

  cancelQueryDialog() {
    this.$mdDialog.cancel();
  }

  showNoImagesWarning() {
    this.$mdToast.show(
      this.$mdToast.simple().textContent('No images matched the query.')
      // .position(pinTo )
      // .hideDelay(3000)
    );
  }
}
