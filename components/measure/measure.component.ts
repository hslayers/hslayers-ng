import {Component} from '@angular/core';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMeasureService} from './measure.service';

@Component({
  selector: 'hs.measure',
  template: require('./partials/measure.html'),
})
export class HsMeasureComponent {
  /*if (HsConfig.design == 'md') {
    return require('./partials/measuremd.html');
  }*/
  type: string;

  constructor(
    private HsEventBusService: HsEventBusService,
    private HsLayoutService: HsLayoutService,
    private HsMeasureService: HsMeasureService
  ) {
    //this.data = this.HsMeasureService.data;
    this.type = 'distance';

    document.addEventListener('keyup', (e) => {
      if (e.keyCode == 17) {
        //ControlLeft
        setTimeout(() => {
          this.HsMeasureService.switchMultipleMode();
        }, 0);
      }
    });

    HsEventBusService.measurementStarts.subscribe(() => {
      this.HsLayoutService.panelEnabled('toolbar', false);
    });

    HsEventBusService.measurementEnds.subscribe(() => {
      this.HsLayoutService.panelEnabled('toolbar', true);
    });

    HsEventBusService.mainPanelChanges.subscribe((event) => {
      if (HsLayoutService.mainpanel == 'measure') {
        this.HsMeasureService.activateMeasuring(this.type);
      } else {
        this.HsMeasureService.deactivateMeasuring();
      }
    });

    //Temporary fix when measure panel is loaded as deafult (e.g. reloading page with parameters in link)
    if (this.HsLayoutService.mainpanel == 'measure') {
      this.HsMeasureService.activateMeasuring(this.type);
    }

    //$scope.$emit('scope_loaded', 'Measure');
  }

  ngOnChanges(): void {
    if (this.HsLayoutService.mainpanel != 'measure') {
      return;
    }
    this.HsMeasureService.changeMeasureParams(this.type);
  }

  /**
   * @memberof hs.measure.controller
   * @function clearAll
   * @public
   * @description Reset sketch and all measurements to start new drawing
   */
  clearAll(): void {
    this.HsMeasureService.clearMeasurement();
  }
}
