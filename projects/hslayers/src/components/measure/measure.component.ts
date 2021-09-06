import {Component, OnDestroy} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMeasureService} from './measure.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-measure',
  templateUrl: './partials/measure.html',
})
export class HsMeasureComponent
  extends HsPanelBaseComponent
  implements OnDestroy {
  type: string;
  data;
  name = 'measure';

  private ngUnsubscribe = new Subject();
  constructor(
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    public HsMeasureService: HsMeasureService,
    private HsUtilsService: HsUtilsService
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
      .subscribe(() => {
        this.HsLayoutService.panelEnabled('toolbar', false);
      });

    this.HsEventBusService.measurementEnds
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.HsLayoutService.panelEnabled('toolbar', true);
      });

    this.HsEventBusService.mainPanelChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        if (HsLayoutService.mainpanel == 'measure') {
          this.HsMeasureService.activateMeasuring(this.type);
        } else {
          this.HsMeasureService.deactivateMeasuring();
        }
      });

    //Temporary fix when measure panel is loaded as default (e.g. reloading page with parameters in link)
    if (this.HsLayoutService.mainpanel == 'measure') {
      this.HsMeasureService.activateMeasuring(this.type);
    }

    //$scope.$emit('scope_loaded', 'Measure');
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  changeMeasureParams(): void {
    if (this.HsLayoutService.mainpanel != 'measure') {
      return;
    }
    this.HsMeasureService.changeMeasureParams(this.type);
  }

  /**
   * Reset sketch and all measurements to start new drawing
   */
  clearAll(): void {
    this.HsMeasureService.clearMeasurement();
  }
}
