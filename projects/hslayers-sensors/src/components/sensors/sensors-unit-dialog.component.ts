import {AsyncPipe, KeyValuePipe, NgStyle} from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewRef,
  inject,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {LangChangeEvent, TranslatePipe} from '@ngx-translate/core';
import {NgbDatepickerModule} from '@ng-bootstrap/ng-bootstrap';
import {combineLatest, map, startWith} from 'rxjs';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';

import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayoutService} from 'hslayers-ng/services/layout';

import {Aggregates, HsSensorsUnitDialogService} from './unit-dialog.service';
import {CustomInterval, Interval} from './types/interval.type';

@Component({
  selector: 'hs-sensor-unit',
  templateUrl: './partials/unit-dialog.component.html',
  styles: `
    @keyframes fadein {
      0% {
        opacity: 0;
      }

      100% {
        opacity: 1;
      }
    }
    .fadein {
      animation: fadein 1s ease-out;
      animation-fill-mode: forwards;
    }
    th,
    td {
      padding: 0.25rem 0.5rem;
      text-align: right;
      border-bottom: 1px solid #ddd;

      &.title-column {
        text-align: left;
      }

      &.color-column {
        vertical-align: middle;
        padding: 0 4px;

        .color-indicator {
          height: 10px;
          width: 35px;
        }
      }
    }
  `,
  imports: [
    TranslatePipe,
    NgStyle,
    AsyncPipe,
    KeyValuePipe,
    NgbDatepickerModule,
    FormsModule,
  ],
})
export class HsSensorsUnitDialogComponent implements HsDialogComponent, OnInit {
  private hsLayoutService = inject(HsLayoutService);
  private hsDialogContainerService = inject(HsDialogContainerService);
  hsSensorsUnitDialogService = inject(HsSensorsUnitDialogService);
  private hsLanguageService = inject(HsLanguageService);
  private cdr = inject(ChangeDetectorRef);
  elementRef = inject(ElementRef);

  customInterval: CustomInterval = {
    name: 'Custom',
    fromTime: new Date(),
    toTime: new Date(),
    timeFormat: '%H:%M',
  };

  dialogStyle = toSignal(
    combineLatest([
      this.hsLayoutService.panelSpaceWidth,
      this.hsLayoutService.sidebarPosition,
    ]).pipe(
      map(([panelSpace, sidebar]) => {
        return this.calculateDialogStyle(panelSpace, sidebar == 'bottom');
      }),
      startWith({
        'left': '320px',
        'width': 'calc(100% - 320px)',
        'bottom': '0',
        'height': 'auto',
        'background-color': 'transparent',
        'pointer-events': 'none',
      }),
      takeUntilDestroyed(),
    ),
  );

  viewRef: ViewRef;
  data: any;

  constructor() {
    this.hsSensorsUnitDialogService.dialogElement = this.elementRef;
  }

  ngOnInit(): void {
    this.hsSensorsUnitDialogService.unitDialogVisible = true;
    this.hsSensorsUnitDialogService.dialogElement = this.elementRef;

    this.timeButtonClicked(this.hsSensorsUnitDialogService.intervals[2], false);

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
      this.hsSensorsUnitDialogService.createChart$.next(
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

  calculateDialogStyle(panelSpaceWidth: number, sidebarAtBot: boolean): any {
    const padding = 20;
    const widthWithoutPanelSpace =
      'calc(100% - ' + (panelSpaceWidth + padding) + 'px)';
    return {
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
}
