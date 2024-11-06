//TODO: Check if this import is still needed. Breaks production though
//import 'ol-popup/src/ol-popup.css';
import {Component, Inject, OnInit, Type} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import Popup from 'ol-popup';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {AsyncPipe, NgClass} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsDrawService} from 'hslayers-ng/services/draw';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {
  HsPanelBaseComponent,
  HsPanelHeaderComponent,
} from 'hslayers-ng/common/panels';
import {HsQueryBaseService} from 'hslayers-ng/services/query';
import {HsQueryDefaultInfoPanelBodyComponent} from './default-info-panel-body/default-info-panel-body.component';
import {HsQueryVectorService} from 'hslayers-ng/services/query';
import {HsQueryWmsService} from './query-wms.service';
import {QUERY_INFO_PANEL} from './query.tokens';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-query',
  templateUrl: './query.component.html',
  standalone: true,
  imports: [
    TranslateCustomPipe,
    HsPanelHeaderComponent,
    AsyncPipe,
    NgClass,
    FormsModule,
  ],
  providers: [
    {
      provide: QUERY_INFO_PANEL,
      useValue: HsQueryDefaultInfoPanelBodyComponent, // Default value
    },
  ],
})
export class HsQueryComponent extends HsPanelBaseComponent implements OnInit {
  popup = new Popup();
  popupOpens: Subject<any> = new Subject();
  name = 'query';
  //To deactivate queries (unsubscribe subscribers) per app
  queryDeactivator = new Subject<void>();

  constructor(
    public hsQueryBaseService: HsQueryBaseService,
    private hsMapService: HsMapService,
    private hsLog: HsLogService,
    private hsQueryVectorService: HsQueryVectorService,
    private hsDrawService: HsDrawService,
    private hsQueryWmsService: HsQueryWmsService,
    @Inject(QUERY_INFO_PANEL) public infoPanelComponent: Type<any>,
  ) {
    super();
  }
  async ngOnInit() {
    super.ngOnInit();
    this.popupOpens
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((source) => {
        if (source && source != 'hs.query' && this.popup !== undefined) {
          this.popup.hide();
        }
      });

    this.hsQueryVectorService.featureRemovals
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((feature) => {
        this.hsQueryBaseService.features.splice(
          this.hsQueryBaseService.features.indexOf(feature),
          1,
        );
      });
    this.hsMapService.loaded().then((map) => {
      map.addOverlay(this.popup);
    });
    //add current panel queryable - activate/deactivate
    this.hsLayoutService.mainpanel$
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe((which) => {
        if (this.hsQueryBaseService.currentPanelQueryable()) {
          if (
            !this.hsQueryBaseService.queryActive &&
            !this.hsDrawService.drawActive
          ) {
            this.hsQueryBaseService.activateQueries();
          }
        } else {
          if (this.hsQueryBaseService.queryActive) {
            this.hsQueryBaseService.deactivateQueries();
          }
        }
      });
    this.hsQueryBaseService.queryStatusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => {
        this.queryStatusChanged(status);
      });
    const active = this.hsQueryBaseService.queryActive;
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(takeUntil(this.queryDeactivator))
      .subscribe((evt) => {
        this.popup.hide();
        if (
          this.hsQueryBaseService.currentPanelQueryable() &&
          this.hsLayoutService.mainpanel != 'draw'
        ) {
          this.hsLayoutService.setMainPanel('query');
        }
      });

    this.hsQueryBaseService.getFeatureInfoCollected
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(takeUntil(this.queryDeactivator))
      .subscribe((coordinate) => {
        const invisiblePopup: HTMLIFrameElement =
          this.hsQueryBaseService.getInvisiblePopup();
        if (!invisiblePopup) {
          return;
        }
        const bodyElementsFound = this.checkForBodyElements(
          invisiblePopup.contentDocument.body.children,
        );
        if (!bodyElementsFound) {
          return;
        }
        //TODO: don't count style, title, meta towards length
        if (this.hsQueryBaseService.popupClassname.length > 0) {
          this.popup.getElement().className =
            this.hsQueryBaseService.popupClassname;
        } else {
          this.popup.getElement().className = 'ol-popup';
        }
        if (!coordinate) {
          //FIXME: why setting empty coordinates for pop-up?
          this.hsLog.log('empty coordinates for', this.popup);
        } else {
          this.popup.show(
            coordinate,
            invisiblePopup.contentDocument.body.innerHTML,
          );
          this.popupOpens.next('hs.query');
        }
      });
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
      this.hsQueryBaseService == undefined ||
      (this.hsQueryBaseService.features.length == 0 &&
        (this.hsQueryBaseService.coordinates === undefined ||
          this.hsQueryBaseService.coordinates.length == 0))
    );
  }
}
