//TODO: Check if this import is still needed. Breaks production though
//import 'ol-popup/src/ol-popup.css';
import {Component, OnDestroy} from '@angular/core';

import Popup from 'ol-popup';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsConfig} from '../../config.service';
import {HsDrawService} from '../draw/draw.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryVectorService} from './query-vector.service';
import {HsQueryWmsService} from './query-wms.service';

@Component({
  selector: 'hs-query',
  templateUrl: './partials/infopanel.html',
})
export class HsQueryComponent implements OnDestroy {
  popup = new Popup();
  popupOpens: Subject<any> = new Subject();
  private ngUnsubscribe = new Subject();
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
    this.HsEventBusService.mainPanelChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((closed) => {
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

    this.HsQueryBaseService.queryStatusChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.HsQueryBaseService.getFeatureInfoStarted
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((e) => {
            this.popup.hide();
            if (
              this.HsQueryBaseService.currentPanelQueryable() &&
              this.HsLayoutService.mainpanel != 'draw'
            ) {
              this.HsLayoutService.setMainPanel('info');
            }
          });

        this.HsQueryBaseService.getFeatureInfoCollected
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((coordinate) => {
            const invisiblePopup: any =
              this.HsQueryBaseService.getInvisiblePopup();
            if (!invisiblePopup) {
              return;
            }
            const bodyElementsFound = this.checkForBodyElements(
              invisiblePopup.contentDocument.body.children
            );
            if (bodyElementsFound) {
              //TODO: dont count style, title, meta towards length
              if (this.HsQueryBaseService.popupClassname.length > 0) {
                this.popup.getElement().className =
                  this.HsQueryBaseService.popupClassname;
              } else {
                this.popup.getElement().className = 'ol-popup';
              }
              this.popup.show(
                coordinate,
                invisiblePopup.contentDocument.body.innerHTML
              );
              this.popupOpens.next('hs.query');
            }
          });
      });

    this.popupOpens.pipe(takeUntil(this.ngUnsubscribe)).subscribe((source) => {
      if (source && source != 'hs.query' && this.popup !== undefined) {
        this.popup.hide();
      }
    });

    this.HsQueryVectorService.featureRemovals
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((feature) => {
        this.HsQueryBaseService.data.features.splice(
          this.HsQueryBaseService.data.features.indexOf(feature),
          1
        );
      });
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
  checkForBodyElements(docChildren: any): boolean {
    return Array.from(docChildren).some((ch: any) => {
      if (ch.tagName == 'TITLE' && ch.title == '') {
        return false;
      }
      return (
        ch.tagName != 'SERVICEEXCEPTIONREPORT' &&
        ch.tagName != 'META' &&
        ch.tagName != 'STYLE'
      );
    });
  }
  noFeatureSelected(): boolean {
    return (
      this.HsQueryBaseService.data.features.length == 0 &&
      (this.HsQueryBaseService.data.coordinates === undefined ||
        this.HsQueryBaseService.data.coordinates.length == 0)
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
