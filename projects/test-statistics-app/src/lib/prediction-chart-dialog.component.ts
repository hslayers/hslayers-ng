import {Component, ElementRef, Input, OnInit, ViewRef} from '@angular/core';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {default as vegaEmbed} from 'vega-embed';

import {ColumnWrapper} from './column-wrapper.type';
import {CorpusItemValues, HsStatisticsService} from './statistics.service';
import {
  HsDialogComponent,
  HsDialogContainerService,
  HsLanguageService,
  HsLayerUtilsService,
} from 'hslayers-ng';
import {max} from 'simple-statistics';

dayjs.extend(utc);
const CHART_DIV = '.hs-statistics-prediction';
/**
 * Dialog window to choose variables and filters to visualize data on map.
 * Can be used both for uploaded, but not yet stored data or
 * data from stored corpus.
 */
@Component({
  selector: 'hs-prediction-chart-dialog',
  templateUrl: './prediction-chart-dialog.component.html',
})
export class HsStatisticsPredictionChartDialogComponent
  implements HsDialogComponent, OnInit
{
  @Input() data: {
    app: string;
  };
  viewRef: ViewRef;
  selectedLocation: any;
  timeValues: any[];
  timeColumn: string;
  filteredRows: any[];
  locationColumn: string;
  locationValues: string[];
  predictions: any;
  selectedPrediction: any;
  variables: ColumnWrapper[];
  predictedVariable: string;
  fromYear = new Date().getFullYear();
  tillYear = new Date().getFullYear() + 10;
  years: number[];
  dict: {
    [key: string]: {values: CorpusItemValues; location?: string; time?: string};
  };
  regressionParams: any;
  shifts: {};

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsLayerUtilsService: HsLayerUtilsService,
    private HsLanguageService: HsLanguageService,
    private elementRef: ElementRef,
    public hsStatisticsService: HsStatisticsService
  ) {}

  ngOnInit(): void {
    this.locationColumn = 'location';
    this.timeColumn = 'time';

    this.predictions = this.hsStatisticsService.get(this.data.app).predictions;
  }

  close(): void {
    this.HsDialogContainerService.destroy(this, this.data.app);
  }

  dateRangeChanged() {
    const range = (start: number, end: number) =>
      Array.from({length: end - start}, (v, k) => k + start);
    this.years = range(Math.floor(this.fromYear), Math.floor(this.tillYear));
    this.fillPlaceholders();
  }

  selectPrediction(prediction) {
    this.selectedPrediction = prediction;
    this.variables = prediction.variables;
    this.regressionParams = prediction.coefficients;
    this.predictedVariable = prediction.predictedVariable;
    this.dict = Object.assign(
      {},
      this.hsStatisticsService.get(this.data.app).corpus.dict
    );
    const tmpLocValues = Object.keys(this.dict)
      .map((key) => this.dict[key])
      .map((row) => row.location);

    this.locationValues = tmpLocValues.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
    this.shifts = this.variables.reduce(
      (obj, item) => Object.assign(obj, {[item.name]: item.shift}),
      {}
    );
    this.dateRangeChanged();
  }

  selectFilter(value: any): void {
    this.selectedLocation = value;
    this.applyFilters();
    this.visualize();
  }

  fillPlaceholders() {
    for (const year of this.years) {
      if (this.dict[this.selectedLocation + '::' + year] == undefined) {
        this.dict[this.selectedLocation + '::' + year] = {
          values: {},
          time: year.toString(),
          location: this.selectedLocation,
        };
      }
    }
  }

  predict() {
    for (const year of this.years) {
      let tmp = 0;
      for (const variable of this.regressionParams.variables) {
        const key = this.hsStatisticsService.adjustDictionaryKey(
          this.dict,
          this.selectedLocation + '::' + year,
          variable.name,
          this.shifts
        );
        if (this.dict[key] === undefined) {
          tmp = null;
          continue;
        }
        tmp += variable.coefficient * this.dict[key].values[variable.name];
      }
      if (tmp !== null) {
        tmp += this.regressionParams.constant;
      }
      this.dict[this.selectedLocation + '::' + year].values[
        this.predictedVariable
      ] = tmp;
    }
  }

  applyFilters() {
    this.filteredRows = Object.keys(this.dict)
      .map((key) => this.dict[key])
      .filter((row) => row.location == this.selectedLocation);
  }

  async visualize(): Promise<void> {
    /* const observations = this.colWrappers
      .filter(
        (col) =>
          col.name == this.data.factor.name ||
          col.name == this.predictedVariable
      )
      .reduce(
        (acc, col) =>
          acc.concat(
            this.filteredRows.map((s) => {
              const item = {
                value: s.values[col.name],
                name: col.name,
                time: s.time,
                time_stamp: undefined,
              };
              try {
                const time = dayjs(s.time);
                item.time_stamp = time.toDate().toISOString();
              } catch (ex) {}
              return item;
            })
          ),
        []
      );
    observations.sort((a, b) => {
      if (a.time_stamp > b.time_stamp) {
        return 1;
      }
      if (b.time_stamp > a.time_stamp) {
        return -1;
      }
      return 0;
    });
    
    const chartDiv = this.elementRef.nativeElement.querySelector(CHART_DIV);
    const maxTime = max(observations.map((obs) => obs.time));
    
    const chartHeight = chartDiv.parentElement.offsetHeight - 40;*/
    try {
      //      vegaEmbed(chartDiv, chartData);
    } catch (ex) {
      console.warn('Could not create vega chart:', ex);
    }
  }
}
