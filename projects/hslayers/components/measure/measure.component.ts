import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subject, takeUntil} from 'rxjs';

import {HsEventBusService} from 'hslayers-ng/shared/core';
import {HsLayoutService} from 'hslayers-ng/components/layout';
import {HsMeasureService} from './measure.service';
import {HsPanelBaseComponent} from 'hslayers-ng/components/layout';
import {HsSidebarService} from 'hslayers-ng/components/sidebar';
import {HsUtilsService} from 'hslayers-ng/shared/utils';

@Component({
  selector: 'hs-measure',
  templateUrl: './measure.component.html',
})
export class HsMeasureComponent
  extends HsPanelBaseComponent
  implements OnDestroy, OnInit
{
  type: string;
  name = 'measure';
  private end = new Subject<void>();
  constructor(
    private hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    public hsMeasureService: HsMeasureService,
    private hsUtilsService: HsUtilsService,
    private hsSidebarService: HsSidebarService,
  ) {
    super(hsLayoutService);
  }
  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit() {
    super.ngOnInit();
    this.type = 'distance';

    if (this.hsUtilsService.runningInBrowser()) {
      document.addEventListener('keyup', (e) => {
        if (e.key == 'Control') {
          //ControlLeft
          setTimeout(() => {
            this.hsMeasureService.switchMultipleMode();
          }, 0);
        }
      });
    }
    this.hsEventBusService.measurementStarts
      .pipe(takeUntil(this.end))
      .subscribe(() => {
        this.hsLayoutService.panelEnabled('toolbar', false);
      });

    this.hsEventBusService.measurementEnds
      .pipe(takeUntil(this.end))
      .subscribe(() => {
        this.hsLayoutService.panelEnabled('toolbar', true);
      });

    this.hsLayoutService.mainpanel$
      .pipe(takeUntil(this.end))
      .subscribe((which) => {
        if (this.hsLayoutService.mainpanel == 'measure') {
          this.hsMeasureService.activateMeasuring(this.type);
        } else {
          this.hsMeasureService.deactivateMeasuring();
        }
      });

    //Temporary fix when measure panel is loaded as default (e.g. reloading page with parameters in link)
    if (this.hsLayoutService.mainpanel == 'measure') {
      this.hsMeasureService.activateMeasuring(this.type);
    }
  }

  /**
   * Change geometry type of measurement without deleting of old ones
   */
  changeMeasureParams(): void {
    if (this.hsLayoutService.mainpanel != 'measure') {
      return;
    }
    this.hsMeasureService.changeMeasureParams(this.type);
  }

  /**
   * Reset sketch and all measurements to start new drawing
   */
  clearAll(): void {
    this.hsMeasureService.clearMeasurement();
  }
}
