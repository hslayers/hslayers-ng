import {Component, OnDestroy} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

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
  implements OnDestroy
{
  type: string;
  data;
  name = 'measure';

  private ngUnsubscribe = new Subject<void>();
  constructor(
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    public HsMeasureService: HsMeasureService,
    private HsUtilsService: HsUtilsService,
    private hsLanguageService: HsLanguageService,
    private hsSidebarService: HsSidebarService
  ) {
    super(HsLayoutService);
    this.data = this.HsMeasureService.data;
    this.type = 'distance';

    if (this.HsUtilsService.runningInBrowser()) {
      document.addEventListener('keyup', (e) => {
        if (e.key == 'Control') {
          //ControlLeft
          setTimeout(() => {
            this.HsMeasureService.switchMultipleMode();
          }, 0);
        }
      });
    }
    this.HsEventBusService.measurementStarts
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({app}) => {
        if (app == this.data.app) {
          this.HsLayoutService.panelEnabled('toolbar', app, false);
        }
      });

    this.HsEventBusService.measurementEnds
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({app}) => {
        if (app == this.data.app) {
          this.HsLayoutService.panelEnabled('toolbar', app, true);
          this.data = this.HsMeasureService.data;
        }
      });

    this.HsEventBusService.mainPanelChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({which, app}) => {
        if (HsLayoutService.get(app).mainpanel == 'measure') {
          this.HsMeasureService.activateMeasuring(this.type, app);
        } else {
          this.HsMeasureService.deactivateMeasuring(app);
        }
      });

    //Temporary fix when measure panel is loaded as default (e.g. reloading page with parameters in link)
    if (this.HsLayoutService.get(this.data.app).mainpanel == 'measure') {
      this.HsMeasureService.activateMeasuring(this.type, this.data.app);
    }

    //$scope.$emit('scope_loaded', 'Measure');
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit() {
    //Don't need two buttons (sidebar and toolbar) to toggle measure panel
    if (
      !this.HsLayoutService.componentEnabled('measureToolbar', this.data.app)
    ) {
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
              this.data.app
            ),
          description: () =>
            this.hsLanguageService.getTranslation(
              'SIDEBAR.descriptions.MEASURE',
              undefined,
              this.data.app
            ),
          icon: 'icon-design',
          condition: true,
        },
        this.data.app
      );
    }
  }

  changeMeasureParams(): void {
    if (this.HsLayoutService.get(this.data.app).mainpanel != 'measure') {
      return;
    }
    this.HsMeasureService.changeMeasureParams(this.type, this.data.app);
  }

  /**
   * Reset sketch and all measurements to start new drawing
   */
  clearAll(): void {
    this.HsMeasureService.clearMeasurement();
  }
}
