import {Component, ElementRef, OnInit, ViewRef} from '@angular/core';

import {HsDialogComponent} from 'hslayers-ng';
import {HsDialogContainerService} from 'hslayers-ng';
import {HsLayoutService} from 'hslayers-ng';
import {HsUtilsService} from 'hslayers-ng';

import {Aggregate} from './types/aggregate.type';
import {HsSensorsUnitDialogService} from './unit-dialog.service';
import {Interval} from './types/interval.type';

@Component({
  selector: 'hs-sensor-unit',
  templateUrl: './partials/unit-dialog.component.html',
})
export class HsSensorsUnitDialogComponent implements HsDialogComponent, OnInit {
  customInterval = {name: 'Custom', fromTime: new Date(), toTime: new Date()};

  constructor(
    private hsLayoutService: HsLayoutService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsSensorsUnitDialogService: HsSensorsUnitDialogService,
    private hsUtilsService: HsUtilsService,
    public elementRef: ElementRef
  ) {}
  viewRef: ViewRef;
  data: any;

  ngOnInit(): void {
    this.hsSensorsUnitDialogService.get(this.data.app).unitDialogVisible = true;
    this.hsSensorsUnitDialogService.get(this.data.app).dialogElement =
      this.elementRef;
    this.timeButtonClicked(
      this.hsSensorsUnitDialogService.get(this.data.app).intervals[2]
    );
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
   * Get ajax loader icon
   */
  getAjaxLoader(): string {
    return this.hsUtilsService.getAjaxLoaderIcon(this.data.app);
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

  /**
   * Set unit dialog style
   */
  dialogStyle() {
    return {
      'visibility': this.hsSensorsUnitDialogService.get(this.data.app)
        .unitDialogVisible
        ? 'visible'
        : 'hidden',
      'left': this.hsLayoutService.sidebarBottom()
        ? '3px'
        : this.hsLayoutService.panelSpaceWidth(this.data.app) + 10 + 'px',
      'width': this.hsLayoutService.sidebarBottom()
        ? '100%'
        : 'calc(' +
          this.hsLayoutService.widthWithoutPanelSpace(this.data.app) +
          ')',
      'bottom': this.hsLayoutService.sidebarBottom() ? '46.5em' : '0',
      'height': this.hsLayoutService.sidebarBottom() ? '5em' : 'auto',
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
}
