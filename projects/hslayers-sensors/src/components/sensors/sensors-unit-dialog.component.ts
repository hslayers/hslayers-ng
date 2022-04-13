import {Component, ElementRef, OnDestroy, OnInit, ViewRef} from '@angular/core';

import {HsDialogComponent} from 'hslayers-ng';
import {HsDialogContainerService} from 'hslayers-ng';
import {HsLayoutService} from 'hslayers-ng';
import {HsUtilsService} from 'hslayers-ng';

import {Aggregate} from './types/aggregate.type';
import {HsSensorsUnitDialogService} from './unit-dialog.service';
import {Interval} from './types/interval.type';
import {Subject, takeUntil} from 'rxjs';

@Component({
  selector: 'hs-sensor-unit',
  templateUrl: './partials/unit-dialog.component.html',
})
export class HsSensorsUnitDialogComponent
  implements HsDialogComponent, OnInit, OnDestroy
{
  customInterval = {name: 'Custom', fromTime: new Date(), toTime: new Date()};
  dialogStyle;
  private ngUnsubscribe = new Subject<void>();
  viewRef: ViewRef;
  data: any;

  constructor(
    private hsLayoutService: HsLayoutService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsSensorsUnitDialogService: HsSensorsUnitDialogService,
    private hsUtilsService: HsUtilsService,
    public elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.hsSensorsUnitDialogService.get(this.data.app).unitDialogVisible = true;
    this.hsSensorsUnitDialogService.get(this.data.app).dialogElement =
      this.elementRef;
    this.timeButtonClicked(
      this.hsSensorsUnitDialogService.get(this.data.app).intervals[2]
    );
    this.hsLayoutService.panelSpaceWidth
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({app, width}) => {
        if (app == this.data.app) {
          this.calculateDialogStyle(app, width);
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

  calculateDialogStyle(app: string, panelSpaceWidth: number) {
    const padding = 20;
    const widthWithoutPanelSpace =
      'calc(100% - ' + (panelSpaceWidth + padding) + 'px)';
    const sidebarAtBot = this.hsLayoutService.sidebarBottom();
    this.dialogStyle = {
      'visibility': this.hsSensorsUnitDialogService.get(app).unitDialogVisible
        ? 'visible'
        : 'hidden',
      'left': sidebarAtBot ? '3px' : panelSpaceWidth + padding + 'px',
      'width': sidebarAtBot ? '100%' : `calc(${widthWithoutPanelSpace})`,
      'bottom': sidebarAtBot ? '46.5em' : '0',
      'height': sidebarAtBot ? '5em' : 'auto',
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
