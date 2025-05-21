import {Component, Inject, OnInit, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsMeasureService} from './measure.service';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';

@Component({
  selector: 'hs-measure',
  templateUrl: './measure.component.html',
  standalone: false,
})
export class HsMeasureComponent extends HsPanelBaseComponent implements OnInit {
  type: string;
  name = 'measure';
  constructor(
    private hsEventBusService: HsEventBusService,
    public hsMeasureService: HsMeasureService,
    @Inject(PLATFORM_ID) private platformId: any,
  ) {
    super();
  }

  ngOnInit() {
    super.ngOnInit();
    this.type = 'distance';

    if (isPlatformBrowser(this.platformId)) {
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.hsLayoutService.panelEnabled('toolbar', false);
      });

    this.hsEventBusService.measurementEnds
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.hsLayoutService.panelEnabled('toolbar', true);
      });

    this.hsLayoutService.mainpanel$
      .pipe(takeUntilDestroyed(this.destroyRef))
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
