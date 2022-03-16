import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMeasureService} from './measure.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSidebarService} from '../sidebar/sidebar.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-measure',
  templateUrl: './partials/measure.html',
})
export class HsMeasureComponent
  extends HsPanelBaseComponent
  implements OnDestroy, OnInit {
  type: string;
  serviceData: {
    measurements: Array<any>;
    multipleShapeMode: boolean;
  };
  name = 'measure';

  private ngUnsubscribe = new Subject<void>();
  constructor(
    private hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    private hsMeasureService: HsMeasureService,
    private hsUtilsService: HsUtilsService,
    private hsLanguageService: HsLanguageService,
    private hsSidebarService: HsSidebarService
  ) {
    super(hsLayoutService);
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit() {
    const app = this.data.app;
    this.hsMeasureService.init(app);
    this.serviceData = this.hsMeasureService.get(app).data;
    this.type = 'distance';

    if (this.hsUtilsService.runningInBrowser()) {
      document.addEventListener('keyup', (e) => {
        if (e.key == 'Control') {
          //ControlLeft
          setTimeout(() => {
            this.hsMeasureService.switchMultipleMode(app);
          }, 0);
        }
      });
    }
    this.hsEventBusService.measurementStarts
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({app}) => {
        if (app == app) {
          this.hsLayoutService.panelEnabled('toolbar', app, false);
        }
      });

    this.hsEventBusService.measurementEnds
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({app}) => {
        if (app == app) {
          this.hsLayoutService.panelEnabled('toolbar', app, true);
          this.serviceData = this.hsMeasureService.get(app).data;
        }
      });

    this.hsEventBusService.mainPanelChanges
      .pipe(first(), takeUntil(this.ngUnsubscribe))
      .subscribe(({which, app}) => {
        if (this.hsLayoutService.get(app).mainpanel == 'measure') {
          this.hsMeasureService.activateMeasuring(this.type, app);
        } else {
          this.hsMeasureService.deactivateMeasuring(app);
        }
      });

    //Temporary fix when measure panel is loaded as default (e.g. reloading page with parameters in link)
    if (this.hsLayoutService.get(app).mainpanel == 'measure') {
      this.hsMeasureService.activateMeasuring(this.type, app);
    }
    //Don't need two buttons (sidebar and toolbar) to toggle measure panel
    if (!this.hsLayoutService.componentEnabled('measureToolbar', app)) {
      this.hsSidebarService.addButton(
        {
          panel: 'measure',
          module: 'hs.measure',
          order: 2,
          fits: true,
          title: () =>
            this.hsLanguageService.getTranslation(
              'PANEL_HEADER.MEASURE',
              undefined,
              app
            ),
          description: () =>
            this.hsLanguageService.getTranslation(
              'SIDEBAR.descriptions.MEASURE',
              undefined,
              app
            ),
          icon: 'icon-design',
          condition: true,
        },
        app
      );
    }
  }

  /**
   * Change geometry type of measurement without deleting of old ones
   */
  changeMeasureParams(): void {
    if (this.hsLayoutService.get(this.data.app).mainpanel != 'measure') {
      return;
    }
    this.hsMeasureService.changeMeasureParams(this.type, this.data.app);
  }

  /**
   * Reset sketch and all measurements to start new drawing
   */
  clearAll(): void {
    this.hsMeasureService.clearMeasurement(this.data.app);
  }
}
