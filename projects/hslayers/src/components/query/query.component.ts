//TODO: Check if this import is still needed. Breaks production though
//import 'ol-popup/src/ol-popup.css';
import Popup from 'ol-popup';
import {Component} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsDrawService} from '../draw/draw.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryVectorService} from './query-vector.service';
import {HsQueryWmsService} from './query-wms.service';
import {Subject} from 'rxjs';

@Component({
  selector: 'hs-query',
  templateUrl: './partials/infopanel.html',
})
export class HsQueryComponent {
  popup = new Popup();
  popupOpens: Subject<any> = new Subject();

  constructor(
    public HsConfig: HsConfig,
    public HsQueryBaseService: HsQueryBaseService,
    public HsLayoutService: HsLayoutService,
    public HsMapService: HsMapService,
    public HsEventBusService: HsEventBusService,
    public HsQueryVectorService: HsQueryVectorService,
    public HsQueryWmsService: HsQueryWmsService,
    public HsDrawService: HsDrawService
  ) {
    this.HsMapService.loaded().then((map) => {
      map.addOverlay(this.popup);
    });

    //add current panel queriable - activate/deactivate
    this.HsEventBusService.mainPanelChanges.subscribe((closed) => {
      if (this.HsQueryBaseService.currentPanelQueryable()) {
        if (
          !this.HsQueryBaseService.queryActive &&
          !this.HsDrawService.drawActive
        ) {
          this.HsQueryBaseService.activateQueries();
        }
      } else {
        if (this.HsQueryBaseService.queryActive) {
          this.HsQueryBaseService.deactivateQueries();
        }
      }
    });

    this.HsQueryBaseService.queryStatusChanges.subscribe(() => {
      this.HsQueryBaseService.getFeatureInfoStarted.subscribe((e) => {
        this.popup.hide();
        if (
          this.HsQueryBaseService.currentPanelQueryable() &&
          this.HsLayoutService.mainpanel != 'draw'
        ) {
          this.HsLayoutService.setMainPanel('info');
        }
      });

      this.HsQueryBaseService.getFeatureInfoCollected.subscribe(
        (coordinate) => {
          const invisiblePopup: any = this.HsQueryBaseService.getInvisiblePopup();
          const bodyElementsFound = this.checkForBodyElements(
            invisiblePopup.contentDocument.body.children
          );
          if (bodyElementsFound) {
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
            this.popupOpens.next('hs.query');
          }
        }
      );
    });

    this.popupOpens.subscribe((source) => {
      if (source && source != 'hs.query' && this.popup !== undefined) {
        this.popup.hide();
      }
    });

    this.HsQueryVectorService.featureRemovals.subscribe((feature) => {
      this.HsQueryBaseService.data.features.splice(
        this.HsQueryBaseService.data.features.indexOf(feature),
        1
      );
    });
  }
  checkForBodyElements(docChildren: any): boolean {
    return Array.from(docChildren).some(
           (ch: any) =>
        ch.tagName != 'SERVICEEXCEPTIONREPORT' &&
        ch.tagName != 'META' &&
        ch.tagName != 'STYLE'
    );
  }
  showQueryDialog(ev) {
    //TODO Rewrite this to new material design
    /* this.$mdDialog
      .show({
        scope: this,
        preserveScope: true,
        templateUrl: './partials/infopanel.html',
        parent: document.body,
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
      ); */
  }

  cancelQueryDialog() {
    //this.$mdDialog.cancel();
  }

  showNoImagesWarning() {
    /*this.$mdToast.show(
      this.$mdToast.simple().textContent('No images matched the query.')
      // .position(pinTo )
      // .hideDelay(3000)
    );*/
  }
}
