//TODO: Check if this import is still needed. Breaks production though
//import 'ol-popup/src/ol-popup.css';
import {Component, OnDestroy, OnInit} from '@angular/core';

import Popup from 'ol-popup';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsConfig} from '../../config.service';
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

  private ngUnsubscribe = new Subject<void>();
  constructor(
    public hsConfig: HsConfig,
    public hsQueryBaseService: HsQueryBaseService,
    public hsLayoutService: HsLayoutService,
    public hsMapService: HsMapService,
    public hsEventBusService: HsEventBusService,
    public hsQueryVectorService: HsQueryVectorService,
    public hsQueryWmsService: HsQueryWmsService,
    public hsDrawService: HsDrawService,
    public hsSidebarService: HsSidebarService,
    public hsLanguageService: HsLanguageService
  ) {
    super(hsLayoutService);

    this.popupOpens.pipe(takeUntil(this.ngUnsubscribe)).subscribe((source) => {
      if (source && source != 'hs.query' && this.popup !== undefined) {
        this.popup.hide();
      }
    });

    this.hsQueryVectorService.featureRemovals
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((feature) => {
        this.hsQueryBaseService.apps[this.data.app].features.splice(
          this.hsQueryBaseService.apps[this.data.app].features.indexOf(feature),
          1
        );
      });
  }
  async ngOnInit() {
    this.hsSidebarService.addButton(
      {
        panel: 'info',
        module: 'hs.query',
        order: 7,
        fits: true,
        title: () => this.hsLanguageService.getTranslation('PANEL_HEADER.INFO'),
        description: () =>
          this.hsLanguageService.getTranslation('SIDEBAR.descriptions.INFO'),
        icon: 'icon-info-sign',
      },
      this.data.app
    );
    this.hsMapService.loaded(this.data.app).then((map) => {
      map.addOverlay(this.popup);
    });
    await this.hsQueryBaseService.init(this.data.app);
    //add current panel queryable - activate/deactivate
    this.hsEventBusService.mainPanelChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({which, app}) => {
        if (this.data.app == app) {
          if (this.hsQueryBaseService.currentPanelQueryable(this.data.app)) {
            if (
              !this.hsQueryBaseService.queryActive &&
              !this.hsDrawService.get(app).drawActive
            ) {
              this.hsQueryBaseService.activateQueries(this.data.app);
            }
          } else {
            if (this.hsQueryBaseService.queryActive) {
              this.hsQueryBaseService.deactivateQueries(this.data.app);
            }
          }
        }
      });

    this.hsQueryBaseService.queryStatusChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.hsQueryBaseService.getFeatureInfoStarted
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((e) => {
            this.popup.hide();
            if (
              this.hsQueryBaseService.currentPanelQueryable(this.data.app) &&
              this.hsLayoutService.get(this.data.app).mainpanel != 'draw'
            ) {
              this.hsLayoutService.setMainPanel('info', this.data.app);
            }
          });

        this.hsQueryBaseService.getFeatureInfoCollected
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe((coordinate) => {
            const invisiblePopup: any =
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
    const app = this.hsQueryBaseService.apps[this.data.app];
    return (
      app == undefined ||
      (app.features.length == 0 &&
        (app.coordinates === undefined || app.coordinates.length == 0))
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
