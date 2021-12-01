import {Component, ElementRef, Input, OnInit, ViewRef} from '@angular/core';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {default as vegaEmbed} from 'vega-embed';

import {CorpusItemValues, Usage} from './statistics.service';
import {
  HsDialogComponent,
  HsDialogContainerService,
  HsLanguageService,
  HsLayerUtilsService,
} from 'hslayers-ng';

dayjs.extend(utc);
const CHART_DIV = '.hs-statistics-timeseries';
/**
 * Dialog window to choose variables and filters to visualize data on map.
 * Can be used both for uploaded, but not yet stored data or
 * data from stored corpus.
 */
@Component({
  selector: 'hs-time-series-chart-dialog',
  templateUrl: './time-series-chart-dialog.component.html',
})
export class HsStatisticsTimeSeriesChartDialogComponent
  implements HsDialogComponent, OnInit
{
  @Input() data: {
    rows: any[] | {[key: string]: {values: CorpusItemValues}};
    columns: string[];
    uses: Usage;
  };
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
    private HsLanguageService: HsLanguageService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    let tmpTimeValues = [];
    let tmpLocValues = [];
    if (Array.isArray(this.data.rows)) {
      this.locationColumn = this.data.columns.find(
        (col) => this.data.uses[col] == 'location'
      );
      this.timeColumn = this.data.columns.find(
        (col) => this.data.uses[col] == 'time'
      );
      tmpTimeValues = this.data.rows
        .map((row) => row[this.timeColumn])
        .filter((value) => value != undefined);
      tmpLocValues = this.data.rows
        .map((row) => row[this.locationColumn])
        .filter((value) => value != undefined);
    } else {
      this.locationColumn = 'location';
      this.timeColumn = 'time';
      tmpTimeValues = Object.keys(this.data.rows)
        .map((key) => this.data.rows[key])
        .map((row) => row.time);
      tmpLocValues = Object.keys(this.data.rows)
        .map((key) => this.data.rows[key])
        .map((row) => row.location);
    }

    this.timeValues = tmpTimeValues.filter((value, index, self) => {
      //Return only unique items https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
      return self.indexOf(value) === index;
    });

    this.locationValues = tmpLocValues.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
    this.colWrappers = this.data.columns.map((col) => {
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
    if (Array.isArray(this.data.rows)) {
      this.filteredRows = this.data.rows
        .filter((row) => row[this.locationColumn] == this.selectedLocation)
        .map((row) => {
          return {
            values: row,
            location: row[this.locationColumn],
            time: row[this.timeColumn],
          };
        });
    } else {
      this.filteredRows = Object.keys(this.data.rows)
        .map((key) => this.data.rows[key])
        .filter((row) => row.location == this.selectedLocation);
    }
  }

  async visualize(): Promise<void> {
    const observations = this.colWrappers
      .filter((col) => col.checked)
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

    const toolTipVariables = observations
      .map((ob) => ob.name)
      .filter((value, index, self) => {
        return self.indexOf(value) === index;
      })
      .map((v) => {
        return {
          field: v,
          type: 'quantitative',
        };
      });
    //See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat for flattening array
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
      'autosize': {
        'type': 'fit',
        'contains': 'padding',
      },
      'encoding': {'x': {'field': 'time', 'type': 'temporal'}},
      'data': {
        'name': 'data-062c25e80e0ff23df3803082d5c6f7e7',
      },
      'datasets': {
        'data-062c25e80e0ff23df3803082d5c6f7e7': observations,
      },
      'transform': [{type: 'formula', expr: 'datum.value * 2', 'as': 'val2'}],
      'layer': [
        {
          'encoding': {
            'color': {
              'field': 'name',
              'legend': {
                'title': this.HsLanguageService.getTranslation(
                  'STATISTICS.VARIABLES'
                ),
              },
              'type': 'nominal',
              'sort': 'name',
            },
            'x': {
              'axis': {
                'title': this.HsLanguageService.getTranslation(
                  'STATISTICS.TIMESTAMP'
                ),
                'labelOverlap': true,
              },
              'field': 'time',
              'sort': false,
              'type': 'temporal',
            },
            'y': {
              'axis': {
                'title':
                  this.HsLanguageService.getTranslation('STATISTICS.VALUE'),
              },
              'field': 'value',
              'type': 'quantitative',
            },
          },
          'layer': [
            {'mark': 'line'},
            {
              'transform': [{'filter': {'param': 'hover', 'empty': false}}],
              'mark': 'point',
            },
          ],
        },
        {
          'transform': [
            {'pivot': 'name', 'value': 'value', 'groupby': ['time']},
          ],
          'mark': 'rule',
          'encoding': {
            'opacity': {
              'condition': {'value': 0.3, 'param': 'hover', 'empty': false},
              'value': 0,
            },
            'tooltip': toolTipVariables,
          },
          'params': [
            {
              'name': 'hover',
              'select': {
                'type': 'point',
                'fields': ['time'],
                'nearest': true,
                'on': 'mouseover',
                'clear': 'mouseout',
              },
            },
          ],
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
