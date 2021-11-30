import {Component, ElementRef, Input, OnInit, ViewRef} from '@angular/core';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {default as vegaEmbed} from 'vega-embed';

import {ColumnWrapper} from './column-wrapper.type';
import {
  HsDialogComponent,
  HsDialogContainerService,
  HsLanguageService,
  HsLayerUtilsService,
} from 'hslayers-ng';
import {HsStatisticsService, ShiftBy} from './statistics.service';
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
    predictedVariable: string;
    factor: ColumnWrapper;
    shifts: ShiftBy;
  };
  viewRef: ViewRef;
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
    private elementRef: ElementRef,
    public hsStatisticsService: HsStatisticsService
  ) {}

  ngOnInit(): void {
    let tmpTimeValues = [];
    let tmpLocValues = [];

    this.locationColumn = 'location';
    this.timeColumn = 'time';
    tmpTimeValues = Object.keys(this.hsStatisticsService.corpus.dict)
      .map((key) => this.hsStatisticsService.corpus.dict[key])
      .map((row) => row.time);
    tmpLocValues = Object.keys(this.hsStatisticsService.corpus.dict)
      .map((key) => this.hsStatisticsService.corpus.dict[key])
      .map((row) => row.location);

    this.timeValues = tmpTimeValues.filter((value, index, self) => {
      //Return only unique items https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
      return self.indexOf(value) === index;
    });

    this.locationValues = tmpLocValues.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
    this.colWrappers = this.hsStatisticsService.corpus.variables.map((col) => {
      return {checked: true, name: col};
    });
  }

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }

  selectFilter(value: any): void {
    this.selectedLocation = value;
    this.applyFilters();
    this.visualize();
  }

  applyFilters() {
    this.filteredRows = Object.keys(this.hsStatisticsService.corpus.dict)
      .map((key) => this.hsStatisticsService.corpus.dict[key])
      .filter((row) => row.location == this.selectedLocation);
  }

  async visualize(): Promise<void> {
    const observations = this.colWrappers
      .filter(
        (col) =>
          col.name == this.data.factor.name ||
          col.name == this.data.predictedVariable
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
    const chartHeight = chartDiv.parentElement.offsetHeight - 40;
    const chartData: any = {
      '$schema': 'https://vega.github.io/schema/vega/v5.json',
      'config': {
        'mark': {'tooltip': null},
        'axis': {
          'labelColor': 'black',
          'labelFontSize': 10,
          'titleFontSize': 16,
          'titleFontWeight': '600',
        },
      },
      'width': chartDiv.parentElement.offsetWidth - 40,
      'height': chartHeight,
      'autosize': {
        'type': 'fit',
        'contains': 'padding',
      },
      'data': [
        {
          'name': 'realX',
          'values': observations.filter(
            (obs) => obs.name == this.data.factor.name
          ),
          'transform': [{'type': 'filter', 'expr': 'isValid(datum.value)'}],
        },
        {
          'name': 'realY',
          'values': observations.filter(
            (obs) => obs.name == this.data.predictedVariable
          ),
          'transform': [{'type': 'filter', 'expr': 'isValid(datum.value)'}],
        },
        {
          'name': 'inputs',
          'values': [],
          'on': [
            {'trigger': 'shift && clear', 'remove': true},
            {'trigger': '!shift && clicked', 'insert': 'clicked'},
          ],
        },
        {
          'name': 'predictions',
          'values': [],
          'on': [
            {'trigger': 'shift && clear', 'remove': true},
            {'trigger': '!shift && clicked2', 'insert': 'clicked2'},
          ],
          'transform': [
            {
              'type': 'formula',
              'expr': `datum.time  ${
                this.data.shifts[this.data.factor.name] ?? ''
              }`,
              'as': 'shifted_year',
            },
            {
              'type': 'lookup',
              'from': 'realX',
              'key': 'time',
              'fields': ['shifted_year'],
              'values': ['value'],
              'as': ['shiftedRealX'],
            },
            {
              'type': 'lookup',
              'from': 'inputs',
              'key': 'time',
              'fields': ['shifted_year'],
              'values': ['value'],
              'as': ['shiftedInput'],
            },
            {
              'type': 'formula',
              'expr': `(datum.shiftedRealX || datum.shiftedInput) * ${this.data.factor.regressionOutput.m} + ${this.data.factor.regressionOutput.b}`,
              'as': 'predicted_value',
            },
          ],
        },
      ],
      'signals': [
        {
          'name': 'mouseY',
          'description': 'A value that updates in response to mousemove.',
          'update': '1000',
          'on': [{'events': 'mousemove', 'update': "invert('y', y())"}],
        },
        {
          'name': 'mouseX',
          'description': 'A value that updates in response to mousemove.',
          'update': '1000',
          'on': [{'events': 'mousemove', 'update': 'x()'}],
        },
        {
          'name': 'shift',
          'value': false,
          'on': [
            {'events': 'click', 'update': 'event.shiftKey', 'force': true},
          ],
        },
        {
          'name': 'year',
          'description': 'A date value that updates in response to mousemove.',
          'init': maxTime,
          'on': [
            {'events': 'click', 'update': `shift ? ${maxTime} : year + 1`},
          ],
        },
        {
          'name': 'clicked',
          'value': null,
          'on': [
            {
              'events': 'click',
              'update': "{time: toString(year), name: 'Input', value: mouseY}",
              'force': true,
            },
          ],
        },
        {
          'name': 'clicked2',
          'value': null,
          'on': [
            {
              'events': 'click',
              'update':
                "{time: toString(year), name: 'Prediction', value: mouseY}",
              'force': true,
            },
          ],
        },
        {
          'name': 'clear',
          'value': true,
          'on': [
            {'events': 'mouseup[!event.item]', 'update': 'true', 'force': true},
          ],
        },
      ],
      'scales': [
        {
          'name': 'x',
          'type': 'point',
          'range': 'width',
          'padding': 1,
          'domain': {
            'fields': [
              {'data': 'realX', 'field': 'time'},
              {'data': 'realY', 'field': 'time'},
              {'data': 'inputs', 'field': 'time'},
              {'data': 'predictions', 'field': 'time'},
            ],
          },
        },
        {
          'name': 'y',
          'type': 'linear',
          'range': 'height',
          'nice': true,
          'zero': true,
          'domain': {
            'fields': [
              {'data': 'realX', 'field': 'value'},
              {'data': 'realY', 'field': 'value'},
              {'data': 'predictions', 'field': 'value'},
              {'data': 'inputs', 'field': 'value'},
              {'data': 'predictions', 'field': 'predicted_value'},
            ],
          },
        },
        {
          'name': 'color',
          'type': 'ordinal',
          'range': 'category',
          'domain': {
            'fields': [
              {'data': 'realX', 'field': 'name'},
              {'data': 'realY', 'field': 'name'},
              {'data': 'inputs', 'field': 'name'},
              {'data': 'predictions', 'field': 'name'},
            ],
          },
        },
      ],
      'axes': [
        {
          'orient': 'bottom',
          'scale': 'x',
          'title': this.HsLanguageService.getTranslation(
            'STATISTICS.TIMESTAMP'
          ),
          'titleY': 40,
          'titleX': 305,
        },
        {
          'orient': 'left',
          'scale': 'y',
          'title': this.HsLanguageService.getTranslation('STATISTICS.VALUE'),
        },
      ],
      'marks': [
        {
          'type': 'group',
          'from': {
            'facet': {'name': 'series', 'data': 'realX', 'groupby': 'name'},
          },
          'marks': [
            {
              'type': 'line',
              'from': {'data': 'series'},
              'encode': {
                'enter': {
                  'stroke': {'scale': 'color', 'field': 'name'},
                  'strokeWidth': {'value': 2},
                },
                'update': {
                  'strokeOpacity': {'value': 1},
                  'x': {'scale': 'x', 'field': 'time'},
                  'y': {'scale': 'y', 'field': 'value'},
                },
                'hover': {'strokeOpacity': {'value': 0.5}},
              },
            },
          ],
        },
        {
          'type': 'group',
          'from': {
            'facet': {'name': 'series', 'data': 'realY', 'groupby': 'name'},
          },
          'marks': [
            {
              'type': 'line',
              'from': {'data': 'series'},
              'encode': {
                'enter': {
                  'stroke': {'scale': 'color', 'field': 'name'},
                  'strokeWidth': {'value': 2},
                },
                'update': {
                  'strokeOpacity': {'value': 1},
                  'x': {'scale': 'x', 'field': 'time'},
                  'y': {'scale': 'y', 'field': 'value'},
                },
                'hover': {'strokeOpacity': {'value': 0.5}},
              },
            },
          ],
        },
        {
          'type': 'group',
          'from': {
            'facet': {
              'name': 'input_series',
              'data': 'inputs',
              'groupby': 'name',
            },
          },
          'marks': [
            {
              'type': 'symbol',
              'from': {'data': 'input_series'},
              'encode': {
                'enter': {
                  'stroke': {'scale': 'color', 'field': 'name'},
                  'strokeWidth': {'value': 2},
                },
                'update': {
                  'x': {'scale': 'x', 'field': 'time'},
                  'y': {'scale': 'y', 'field': 'value'},
                  'strokeOpacity': {'value': 1},
                },
                'hover': {'strokeOpacity': {'value': 0.5}},
              },
            },
          ],
        },
        {
          'type': 'group',
          'from': {
            'facet': {
              'name': 'predictive_series',
              'data': 'predictions',
              'groupby': 'name',
            },
          },
          'marks': [
            {
              'type': 'line',
              'from': {'data': 'predictive_series'},
              'encode': {
                'enter': {
                  'stroke': {'scale': 'color', 'field': 'name'},
                  'strokeWidth': {'value': 2},
                },
                'update': {
                  'x': {'scale': 'x', 'field': 'time'},
                  'y': {'scale': 'y', 'field': 'predicted_value'},
                  'strokeOpacity': {'value': 1},
                },
                'hover': {'strokeOpacity': {'value': 0.5}},
              },
            },
          ],
        },
        {
          'type': 'rect',
          'encode': {
            'enter': {
              'fill': {'value': '#939597'},
              'fillOpacity': {'value': 0.5},
            },
            'update': {
              'x': {'signal': 'width - 30'},
              'y': {'scale': 'y', 'value': 0},
              'width': {'value': 30},
              'height': {'signal': '-height'},
            },
          },
        },
        {
          'type': 'text',
          'encode': {
            'enter': {'fill': {'value': '#000'}},
            'update': {
              'x': {'signal': 'width - 30'},
              'y': {'scale': 'y', 'signal': 'mouseY'},
              'text': {'signal': "mouseX > width - 50 ? round(mouseY) : ''"},
            },
          },
        },
        {
          'type': 'text',
          'encode': {
            'enter': {'fill': {'value': '#000'}},
            'update': {
              'x': {'signal': 'width - 20'},
              'y': {
                'scale': 'y',
                'signal':
                  'mouseX > width - 50 ? mouseY + mouseY / 10 + 300 : 50',
              },
              'angle': {'value': -90},
              'text': {'value': 'Click here to add guessed input values'},
            },
          },
        },
        {
          'type': 'symbol',
          'encode': {
            'enter': {
              'stroke': {'value': '#FF0000'},
              'strokeWidth': {'value': 2},
            },
            'update': {
              'x': {'signal': 'width - 40'},
              'y': {
                'scale': 'y',
                'signal': 'mouseX > width - 50 ? mouseY : 50',
              },
              'strokeOpacity': {'value': 0.3},
            },
          },
        },
      ],
    };
    try {
      vegaEmbed(chartDiv, chartData);
    } catch (ex) {
      console.warn('Could not create vega chart:', ex);
    }
  }
}
