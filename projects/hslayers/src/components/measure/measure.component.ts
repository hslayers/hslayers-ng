import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMeasureService} from './measure.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-measure',
  templateUrl: './partials/measure.html',
})
export class HsMeasureComponent implements OnDestroy {
  type: string;
  data;
  subscriptions: Subscription[] = [];
  constructor(
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    public HsMeasureService: HsMeasureService,
    private HsUtilsService: HsUtilsService
  ) {
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
    this.subscriptions.push(
      this.HsEventBusService.measurementStarts.subscribe(() => {
        this.HsLayoutService.panelEnabled('toolbar', false);
      })
    );

    this.subscriptions.push(
      this.HsEventBusService.measurementEnds.subscribe(() => {
        this.HsLayoutService.panelEnabled('toolbar', true);
      })
    );

    this.subscriptions.push(
      this.HsEventBusService.mainPanelChanges.subscribe(() => {
        if (HsLayoutService.mainpanel == 'measure') {
          this.HsMeasureService.activateMeasuring(this.type);
        } else {
          this.HsMeasureService.deactivateMeasuring();
        }
      })
    );

    //Temporary fix when measure panel is loaded as deafult (e.g. reloading page with parameters in link)
    if (this.HsLayoutService.mainpanel == 'measure') {
      this.HsMeasureService.activateMeasuring(this.type);
    }

    //$scope.$emit('scope_loaded', 'Measure');
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
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
