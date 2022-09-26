import {Component, ElementRef, OnDestroy, OnInit, ViewRef} from '@angular/core';

import {HsConfig, HsConfigObject, HsDialogComponent} from 'hslayers-ng';
import {HsDialogContainerService} from 'hslayers-ng';
import {HsLayoutService} from 'hslayers-ng';

import {Aggregate} from './types/aggregate.type';
import {HsSensorsUnitDialogService} from './unit-dialog.service';
import {Interval} from './types/interval.type';
import {Subject, combineLatest, takeUntil} from 'rxjs';

@Component({
  selector: 'hs-sensor-unit',
  templateUrl: './partials/unit-dialog.component.html',
})
export class HsSensorsUnitDialogComponent
  implements HsDialogComponent, OnInit, OnDestroy {
  customInterval = {name: 'Custom', fromTime: new Date(), toTime: new Date()};
  dialogStyle;
  private ngUnsubscribe = new Subject<void>();
  viewRef: ViewRef;
  data: any;
  configRef: HsConfigObject;

  constructor(
    private hsLayoutService: HsLayoutService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsSensorsUnitDialogService: HsSensorsUnitDialogService,
    private hsConfig: HsConfig,
    public elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.hsSensorsUnitDialogService.get(this.data.app).unitDialogVisible = true;
    this.configRef = this.hsConfig.get(this.data.app);
    this.hsSensorsUnitDialogService.get(this.data.app).dialogElement =
      this.elementRef;
    this.timeButtonClicked(
      this.hsSensorsUnitDialogService.get(this.data.app).intervals[2]
    );
    combineLatest([
      this.hsLayoutService.panelSpaceWidth.pipe(takeUntil(this.ngUnsubscribe)),
      this.hsLayoutService.sidebarPosition.pipe(takeUntil(this.ngUnsubscribe)),
    ]).subscribe(([panelSpace, sidebar]) => {
      if (panelSpace.app == this.data.app && sidebar.app == this.data.app) {
        this.calculateDialogStyle(
          this.data.app,
          panelSpace.width,
          sidebar.position == 'bottom'
        );
      }
    });
  }

  /**
   * @param sensor - Clicked sensor
   * Regenerate chart for sensor is clicked. If no
   * interval was clicked before use 1 day timeframe by default.
   */
  sensorClicked(sensor): void {
    this.hsSensorsUnitDialogService.selectSensor(sensor, this.data.app);
    if (
      this.hsSensorsUnitDialogService.get(this.data.app).currentInterval ==
      undefined
    ) {
      this.timeButtonClicked({amount: 1, unit: 'days'});
    } else {
      this.hsSensorsUnitDialogService.createChart(
        this.hsSensorsUnitDialogService.get(this.data.app).unit,
        this.data.app
      );
    }
  }

  /**
   * Get unit aggregations
   */
  getAggregations(): Aggregate[] {
    return this.hsSensorsUnitDialogService.get(this.data.app).aggregations;
  }

  /**
   * Get unit intervals
   */
  getIntervals(): Interval[] {
    return this.hsSensorsUnitDialogService.get(this.data.app).intervals;
  }

  /**
   * Get current interval
   */
  getCurrentInterval() {
    return this.hsSensorsUnitDialogService.get(this.data.app).currentInterval;
  }

  /**
   * Get translations to local
   * @param text - Text to translate
   */
  getTranslation(text: string): string {
    return this.hsSensorsUnitDialogService.translate(text, 'SENSORNAMES');
  }

  /**
   * @param interval - Clicked interval button
   * Get data for different time interval and regenerate
   * chart
   */
  timeButtonClicked(interval): void {
    this.hsSensorsUnitDialogService.get(this.data.app).currentInterval =
      interval;
    const fromTo = this.hsSensorsUnitDialogService.getTimeForInterval(interval);
    Object.assign(this.customInterval, {
      fromTime: fromTo.from_time.toDate(),
      toTime: fromTo.to_time.toDate(),
    });
    this.hsSensorsUnitDialogService
      .getObservationHistory(
        this.hsSensorsUnitDialogService.get(this.data.app).unit,
        interval,
        this.data.app
      )
      .then((_) => {
        this.hsSensorsUnitDialogService.createChart(
          this.hsSensorsUnitDialogService.get(this.data.app).unit,
          this.data.app
        );
      });
  }

  /**
   * Act on custom interval data change
   */
  customIntervalChanged(): void {
    this.hsSensorsUnitDialogService.get(this.data.app).currentInterval =
      this.customInterval;
    this.hsSensorsUnitDialogService
      .getObservationHistory(
        this.hsSensorsUnitDialogService.get(this.data.app).unit,
        this.customInterval,
        this.data.app
      )
      .then((_) =>
        this.hsSensorsUnitDialogService.createChart(
          this.hsSensorsUnitDialogService.get(this.data.app).unit,
          this.data.app
        )
      );
  }

  calculateDialogStyle(
    app: string,
    panelSpaceWidth: number,
    sidebarAtBot: boolean
  ) {
    const padding = 20;
    const widthWithoutPanelSpace =
      'calc(100% - ' + (panelSpaceWidth + padding) + 'px)';
    this.dialogStyle = {
      'visibility': this.hsSensorsUnitDialogService.get(app).unitDialogVisible
        ? 'visible'
        : 'hidden',
      'left': sidebarAtBot ? '3px' : panelSpaceWidth + padding + 'px',
      'width': sidebarAtBot ? '100%' : `calc(${widthWithoutPanelSpace})`,
      'bottom': sidebarAtBot ? '22.5em' : '0',
      'height': sidebarAtBot ? '27em' : 'auto',
      'background-color': 'transparent',
      'pointer-events': 'none',
    };
  }

  /**
   * Close unit dialog
   */
  close(): void {
    this.hsDialogContainerService.destroy(this, this.data.app);
    this.hsSensorsUnitDialogService.get(this.data.app).unitDialogVisible =
      false;
  }

  /**
   * Get unit description
   */
  getUnitDescription(): string {
    return this.hsSensorsUnitDialogService.get(this.data.app).unit.description;
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
