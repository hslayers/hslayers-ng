import {Component, ElementRef, Input, OnInit, ViewRef} from '@angular/core';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {default as vegaEmbed} from 'vega-embed';

import {
  CorpusItemValues,
  HsStatisticsService,
  Usage,
} from './statistics.service';
import {
  HsDialogComponent,
  HsDialogContainerService,
  HsLanguageService,
  HsLayerUtilsService,
} from 'hslayers-ng';

dayjs.extend(utc);
const CHART_DIV = '.hs-statistics-regression';
/**
 * Dialog window to choose variables and filters to visualize data on map.
 * Can be used both for uploaded, but not yet stored data or
 * data from stored corpus.
 */
@Component({
  selector: 'hs-regression-dialog',
  templateUrl: './regression-dialog.component.html',
})
export class HsStatisticsRegressionDialogComponent
  implements HsDialogComponent, OnInit
{
  @Input() data: {};
  viewRef: ViewRef;
  selectedVariable: string;
  selectedLocation: any;
  timeValues: any[];
  timeColumn: string;
  filteredRows: any[];
  locationColumn: string;
  locationValues: string[];
  colWrappers: {checked: boolean; name: string}[];

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsStatisticsService: HsStatisticsService,
    private HsLanguageService: HsLanguageService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    let tmpTimeValues = [];
    let tmpLocValues = [];

    this.locationColumn = 'location';
    this.timeColumn = 'time';
    tmpTimeValues = Object.keys(this.HsStatisticsService.corpus.dict)
      .map((key) => this.HsStatisticsService.corpus.dict[key])
      .map((row) => row.time);
    tmpLocValues = Object.keys(this.HsStatisticsService.corpus.dict)
      .map((key) => this.HsStatisticsService.corpus.dict[key])
      .map((row) => row.location);

    this.timeValues = tmpTimeValues.filter((value, index, self) => {
      //Return only unique items https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
      return self.indexOf(value) === index;
    });

    this.locationValues = tmpLocValues.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
    this.colWrappers = this.HsStatisticsService.corpus.variables.map((col) => {
      return {checked: true, name: col};
    });
  }

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }

  selectVariable(variable): void {
    this.selectedVariable = variable;
    this.applyFilters();
  }

  selectFilter(value: any): void {
    this.selectedLocation = value;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredRows = Object.keys(this.HsStatisticsService.corpus.dict).map(
      (key) => this.HsStatisticsService.corpus.dict[key]
    );
  }

  async visualize(): Promise<void> {
    const factor = this.colWrappers
      .find((col) => col.checked)
      .name.replace(/\./g, '\\.');
    const observations = this.filteredRows.map((row) => row.values);
    const chartData: any = {
      '$schema': 'https://vega.github.io/schema/vega-lite/v4.15.0.json',
      'config': {
        'mark': {
          'tooltip': null,
        },
      },
      'width':
        this.elementRef.nativeElement.querySelector(CHART_DIV).parentElement
          .offsetWidth - 40,
      'height':
        this.elementRef.nativeElement.querySelector(CHART_DIV).parentElement
          .offsetHeight - 40,
      'autosize': {
        'type': 'fit',
        'contains': 'padding',
      },
      'data': {
        'name': 'data-062c25e80e0ff23df3803082d5c6f7e7',
      },
      'datasets': {
        'data-062c25e80e0ff23df3803082d5c6f7e7': observations,
      },

      'layer': [
        {
          'mark': {
            'type': 'point',
            'filled': true,
          },
          'encoding': {
            'x': {
              'field': factor,
              'type': 'quantitative',
            },
            'y': {
              'field': this.selectedVariable.replace(/\./g, '\\.'),
              'type': 'quantitative',
            },
          },
        },
        {
          'mark': {
            'type': 'line',
            'color': 'firebrick',
          },
          'transform': [
            {
              'regression': this.selectedVariable.replace(/\./g, '\\.'),
              'on': factor,
            },
          ],
          'encoding': {
            'x': {
              'field': factor,
              'type': 'quantitative',
            },
            'y': {
              'field': this.selectedVariable.replace(/\./g, '\\.'),
              'type': 'quantitative',
            },
          },
        },
        {
          'transform': [
            {
              'regression': this.selectedVariable.replace(/\./g, '\\.'),
              'on': factor,
              'params': true,
            },
            {'calculate': "'R²: '+format(datum.rSquared, '.2f')", 'as': 'R2'},
          ],
          'mark': {
            'type': 'text',
            'color': 'firebrick',
            'x': 'width',
            'align': 'right',
            'y': -5,
          },
          'encoding': {
            'text': {'type': 'nominal', 'field': 'R2'},
          },
        },
      ],
    };
    try {
      vegaEmbed(
        this.elementRef.nativeElement.querySelector(CHART_DIV),
        chartData
      );
    } catch (ex) {
      console.warn('Could not create vega chart:', ex);
    }
  }
}
