import {Component, OnDestroy, OnInit} from '@angular/core';

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
    private hsLanguageService: HsLanguageService,
    private hsSidebarService: HsSidebarService
  ) {
    super(hsLayoutService);
  }
  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit() {
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

    this.hsEventBusService.mainPanelChanges
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
    //Don't need two buttons (sidebar and toolbar) to toggle measure panel
    if (!this.hsLayoutService.componentEnabled('measureToolbar')) {
      this.hsSidebarService.addButton({
        panel: 'measure',
        module: 'hs.measure',
        order: 2,
        fits: true,
        title: 'PANEL_HEADER.MEASURE',
        description: 'SIDEBAR.descriptions.MEASURE',
        icon: 'icon-design',
        condition: true,
      });
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
