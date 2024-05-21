import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewRef,
} from '@angular/core';
import {Subject, combineLatest, takeUntil} from 'rxjs';

import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayoutService} from 'hslayers-ng/services/layout';

import {Aggregates, HsSensorsUnitDialogService} from './unit-dialog.service';
import {CustomInterval, Interval} from './types/interval.type';
import {LangChangeEvent} from '@ngx-translate/core';

@Component({
  selector: 'hs-sensor-unit',
  templateUrl: './partials/unit-dialog.component.html',
})
export class HsSensorsUnitDialogComponent
  implements HsDialogComponent, OnInit, OnDestroy {
  customInterval: CustomInterval = {
    name: 'Custom',
    fromTime: new Date(),
    toTime: new Date(),
  };
  dialogStyle;
  private end = new Subject<void>();
  viewRef: ViewRef;
  data: any;

  constructor(
    private hsLayoutService: HsLayoutService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsSensorsUnitDialogService: HsSensorsUnitDialogService,
    private hsLanguageService: HsLanguageService,
    private cdr: ChangeDetectorRef,
    public elementRef: ElementRef,
  ) {}

  ngOnInit(): void {
    this.hsSensorsUnitDialogService.unitDialogVisible = true;
    this.hsSensorsUnitDialogService.dialogElement = this.elementRef;

    this.timeButtonClicked(this.hsSensorsUnitDialogService.intervals[2], false);

    combineLatest([
      this.hsLayoutService.panelSpaceWidth,
      this.hsLayoutService.sidebarPosition,
    ])
      .pipe(takeUntil(this.end))
      .subscribe(([panelSpace, sidebar]) => {
        this.calculateDialogStyle(panelSpace, sidebar == 'bottom');
      });

    const translator = this.hsLanguageService.getTranslator();
    translator.onLangChange.subscribe((event: LangChangeEvent) => {
      this.cdr.detectChanges();
    });
  }

  /**
   * Get unit aggregations
   */
  getUnitAggregations(): Aggregates {
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
   * Fetch observations and rerender sensor chart when time interval changes
   * Observations are cleared ahead of fetch to make sure only requested timeframe is displayed
   */
  private intervalChangeHandler(): void {
    //Clear observations
    this.hsSensorsUnitDialogService.observations = [];
    const promises = this.hsSensorsUnitDialogService.unit.map((u) => {
      return this.hsSensorsUnitDialogService.getObservationHistory(
        u,
        this.hsSensorsUnitDialogService.currentInterval,
      );
    });
    Promise.all(promises).then((_) => {
      this.hsSensorsUnitDialogService.createChart(
        this.hsSensorsUnitDialogService.unit,
      );
    });
  }

  /**
   * @param interval - Clicked interval button
   * @param generate - Controlling whether to fetch observations and generate charts as well. Not necessary on init
   * Get data for different time interval and regenerate
   * chart
   */
  timeButtonClicked(interval, generate = true): void {
    this.hsSensorsUnitDialogService.currentInterval = interval;
    const fromTo = this.hsSensorsUnitDialogService.getTimeForInterval(interval);
    Object.assign(this.customInterval, {
      fromTime: fromTo.from_time.toDate(),
      toTime: fromTo.to_time.toDate(),
    });
    if (generate) {
      this.intervalChangeHandler();
    }
  }

  /**
   * Act on custom interval data change
   */
  customIntervalChanged(): void {
    this.hsSensorsUnitDialogService.currentInterval = this.customInterval;
    this.intervalChangeHandler();
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
    return this.hsSensorsUnitDialogService.unit
      .map((u) => u.description)
      .join(', ');
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }
}
