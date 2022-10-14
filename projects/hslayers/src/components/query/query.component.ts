//TODO: Check if this import is still needed. Breaks production though
//import 'ol-popup/src/ol-popup.css';
import {Component, OnDestroy, OnInit} from '@angular/core';

import Popup from 'ol-popup';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsDrawService} from '../draw/draw.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryVectorService} from './query-vector.service';
import {HsQueryWmsService} from './query-wms.service';
import {HsSidebarService} from '../sidebar/sidebar.service';

@Component({
  selector: 'hs-query',
  templateUrl: './query.component.html',
})
export class HsQueryComponent
  extends HsPanelBaseComponent
  implements OnDestroy, OnInit {
  popup = new Popup();
  popupOpens: Subject<any> = new Subject();
  name = 'info';
  //To Unsubscribe all subscribers
  private end = new Subject<void>();
  //To deactivate queries (unsubscribe subscribers) per app
  queryDeactivator = new Subject<void>();
  queryBaseAppRef;
  layoutAppRef;
  constructor(
    private hsQueryBaseService: HsQueryBaseService,
    public hsLayoutService: HsLayoutService,
    private hsMapService: HsMapService,
    private hsEventBusService: HsEventBusService,
    private hsQueryVectorService: HsQueryVectorService,
    private hsQueryWmsService: HsQueryWmsService,
    private hsDrawService: HsDrawService,
    private hsSidebarService: HsSidebarService,
    private hsLanguageService: HsLanguageService
  ) {
    super(hsLayoutService);
  }
  async ngOnInit() {
    this.hsSidebarService.addButton(
      {
        panel: 'info',
        module: 'hs.query',
        order: 7,
        fits: true,
        title: 'PANEL_HEADER.INFO',
        description: 'SIDEBAR.descriptions.INFO',
        icon: 'icon-info-sign',
      },
      this.data.app
    );
    this.hsQueryWmsService.init(this.data.app);
    this.queryBaseAppRef = this.hsQueryBaseService.get(this.data.app);
    this.layoutAppRef = this.hsLayoutService.get(this.data.app);
    this.popupOpens.pipe(takeUntil(this.end)).subscribe((source) => {
      if (source && source != 'hs.query' && this.popup !== undefined) {
        this.popup.hide();
      }
    });

    this.hsQueryVectorService.featureRemovals
      .pipe(takeUntil(this.end))
      .subscribe((feature) => {
        this.queryBaseAppRef.features.splice(
          this.queryBaseAppRef.features.indexOf(feature),
          1
        );
      });
    this.hsMapService.loaded(this.data.app).then((map) => {
      map.addOverlay(this.popup);
    });
    await this.hsQueryBaseService.init(this.data.app);
    //add current panel queryable - activate/deactivate
    this.hsEventBusService.mainPanelChanges
      .pipe(takeUntil(this.end))
      .subscribe(({which, app}) => {
        if (this.data.app == app) {
          if (this.hsQueryBaseService.currentPanelQueryable(this.data.app)) {
            if (
              !this.queryBaseAppRef.queryActive &&
              !this.hsDrawService.get(app).drawActive
            ) {
              this.hsQueryBaseService.activateQueries(this.data.app);
            }
          } else {
            if (this.queryBaseAppRef.queryActive) {
              this.hsQueryBaseService.deactivateQueries(this.data.app);
            }
          }
        }
      });
    this.hsQueryBaseService.queryStatusChanges
      .pipe(takeUntil(this.end))
      .subscribe(({status, app}) => {
        if (app == this.data.app) {
          this.queryStatusChanged(status);
        }
      });
    const active = this.hsQueryBaseService.get(this.data.app).queryActive;
    if (active) {
      this.queryStatusChanged(active);
    }
  }

  /**
   * Act on query status changes
   * @param active - Query status state
   */
  queryStatusChanged(active: boolean): void {
    if (!active) {
      this.queryDeactivator.next();
      return;
    }
    this.hsQueryBaseService.getFeatureInfoStarted
      .pipe(takeUntil(this.end))
      .pipe(takeUntil(this.queryDeactivator))
      .subscribe(({evt, app}) => {
        if (this.data.app == app) {
          this.popup.hide();
          if (
            this.hsQueryBaseService.currentPanelQueryable(this.data.app) &&
            this.hsLayoutService.get(this.data.app).mainpanel != 'draw'
          ) {
            this.hsLayoutService.setMainPanel('info', this.data.app);
          }
        }
      });

    this.hsQueryBaseService.getFeatureInfoCollected
      .pipe(takeUntil(this.end))
      .pipe(takeUntil(this.queryDeactivator))
      .subscribe((coordinate) => {
        const invisiblePopup: HTMLIFrameElement =
          this.hsQueryBaseService.getInvisiblePopup();
        if (!invisiblePopup) {
          return;
        }
        const bodyElementsFound = this.checkForBodyElements(
          invisiblePopup.contentDocument.body.children
        );
        if (bodyElementsFound) {
          //TODO: don't count style, title, meta towards length
          if (this.hsQueryBaseService.popupClassname.length > 0) {
            this.popup.getElement().className =
              this.hsQueryBaseService.popupClassname;
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
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  /**
   * Check if popup HTML body contains valid elements
   * @param docChildren - Popup HTML collection
   * @returns True or false
   */
  checkForBodyElements(docChildren: HTMLCollection): boolean {
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

  /**
   * Check if any feature is selected
   * @returns True or false
   */
  noFeatureSelected(): boolean {
    return (
      this.queryBaseAppRef == undefined ||
      (this.queryBaseAppRef.features.length == 0 &&
        (this.queryBaseAppRef.coordinates === undefined ||
          this.queryBaseAppRef.coordinates.length == 0))
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
