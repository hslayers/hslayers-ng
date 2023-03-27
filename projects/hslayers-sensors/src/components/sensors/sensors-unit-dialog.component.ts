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
  private end = new Subject<void>();
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
    this.hsSensorsUnitDialogService.unitDialogVisible = true;
    this.configRef = this.hsConfig;
    this.hsSensorsUnitDialogService.dialogElement = this.elementRef;
    this.timeButtonClicked(this.hsSensorsUnitDialogService.intervals[2]);
    combineLatest([
      this.hsLayoutService.panelSpaceWidth.pipe(takeUntil(this.end)),
      this.hsLayoutService.sidebarPosition.pipe(takeUntil(this.end)),
    ]).subscribe(([panelSpaceWidth, sidebarPosition]) => {
      this.calculateDialogStyle(panelSpaceWidth, sidebarPosition == 'bottom');
    });
  }

  /**
   * @param sensor - Clicked sensor
   * Regenerate chart for sensor is clicked. If no
   * interval was clicked before use 1 day timeframe by default.
   */
  sensorClicked(sensor): void {
    this.hsSensorsUnitDialogService.selectSensor(sensor);
    if (this.hsSensorsUnitDialogService.currentInterval == undefined) {
      this.timeButtonClicked({amount: 1, unit: 'days'});
    } else {
      this.hsSensorsUnitDialogService.createChart(
        this.hsSensorsUnitDialogService.unit
      );
    }
  }

  /**
   * Get unit aggregations
   */
  getAggregations(): Aggregate[] {
    return this.hsSensorsUnitDialogService.aggregations;
  }

  /**
   * Get unit intervals
   */
  getIntervals(): Interval[] {
    return this.hsSensorsUnitDialogService.intervals;
  }

  /**
   * Get current interval
   */
  getCurrentInterval() {
    return this.hsSensorsUnitDialogService.currentInterval;
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
    this.hsSensorsUnitDialogService.currentInterval = interval;
    const fromTo = this.hsSensorsUnitDialogService.getTimeForInterval(interval);
    Object.assign(this.customInterval, {
      fromTime: fromTo.from_time.toDate(),
      toTime: fromTo.to_time.toDate(),
    });
    this.hsSensorsUnitDialogService
      .getObservationHistory(this.hsSensorsUnitDialogService.unit, interval)
      .then((_) => {
        this.hsSensorsUnitDialogService.createChart(
          this.hsSensorsUnitDialogService.unit
        );
      });
  }

  /**
   * Act on custom interval data change
   */
  customIntervalChanged(): void {
    this.hsSensorsUnitDialogService.currentInterval = this.customInterval;
    this.hsSensorsUnitDialogService
      .getObservationHistory(
        this.hsSensorsUnitDialogService.unit,
        this.customInterval
      )
      .then((_) =>
        this.hsSensorsUnitDialogService.createChart(
          this.hsSensorsUnitDialogService.unit
        )
      );
  }

  calculateDialogStyle(panelSpaceWidth: number, sidebarAtBot: boolean) {
    const padding = 20;
    const widthWithoutPanelSpace =
      'calc(100% - ' + (panelSpaceWidth + padding) + 'px)';
    this.dialogStyle = {
      'visibility': this.hsSensorsUnitDialogService.unitDialogVisible
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
    this.hsDialogContainerService.destroy(this);
    this.hsSensorsUnitDialogService.unitDialogVisible = false;
  }

  /**
   * Get unit description
   */
  getUnitDescription(): string {
    return this.hsSensorsUnitDialogService.unit.description;
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }
}
