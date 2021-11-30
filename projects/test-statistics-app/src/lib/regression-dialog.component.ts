import {Component, ElementRef, Input, OnInit, ViewRef} from '@angular/core';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {regression} from 'multiregress';
import {default as vegaEmbed} from 'vega-embed';

import {ColumnWrapper} from './column-wrapper.type';
import {
  HsDialogComponent,
  HsDialogContainerService,
  HsLanguageService,
  HsLayerUtilsService,
} from 'hslayers-ng';
import {HsStatisticsPredictionChartDialogComponent} from './prediction-chart-dialog.component';
import {HsStatisticsService, ShiftBy} from './statistics.service';
import {linearRegression} from 'simple-statistics';

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
  implements HsDialogComponent, OnInit {
  @Input() data: {};
  viewRef: ViewRef;
  selectedVariable: string;
  selectedLocation: any;
  timeValues: any[];
  timeColumn: string;
  filteredRows: any[];
  locationColumn: string;
  locationValues: string[];
  colWrappers: ColumnWrapper[];
  regressionTypes = [
    {title: 'Linear', name: 'linear'},
    {title: 'Multiple linear', name: 'multi-linear'},
  ];
  selectedRegressionType = this.regressionTypes[0];
  multipleRegressionOutput;
  shifts: ShiftBy = {};

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public hsStatisticsService: HsStatisticsService,
    private HsLanguageService: HsLanguageService,
    private elementRef: ElementRef,
    private hsDialogContainerService: HsDialogContainerService
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
      return {checked: true, name: col, shift: 0};
    });
  }

  updateShifting(variable: string, shiftBy: number) {
    this.shifts[variable] = shiftBy;
    this.visualize();
  }

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }

  selectVariable(variable): void {
    this.selectedVariable = variable;
    this.visualize();
  }

  private visualize() {
    switch (this.selectedRegressionType.name) {
      case 'linear':
        for (const col of this.colWrappers) {
          this.visualizeSimpleReg(col);
        }
        break;
      case 'multi-linear':
        this.visualizeMulti();
        break;
      default:
    }
  }
  visualizeMulti() {
    const factors = this.colWrappers
      .filter((col) => col.checked && col.name !== this.selectedVariable)
      .map((col) => col.name);

    const observations = this.filteredRows
      .map((row) => {
        const tmp = {};
        Object.assign(tmp, row.values);
        Object.assign(tmp, {time: row.location + row.time});
        for (const col of factors) {
          tmp[`X${factors.indexOf(col)}`] = row.values[col];
          tmp[`Y`] = row.values[this.selectedVariable];
        }
        return tmp;
      })
      //Each factor and also the predicted variable needs to have value to calculate anything
      .filter(
        (row) =>
          factors.reduce(
            (accumulator, factor) => row[factor] && accumulator,
            true
          ) && row[this.selectedVariable]
      );

    observations.sort((a: any, b: any) => {
      if (a.time > b.time) {
        return 1;
      }
      if (b.time > a.time) {
        return -1;
      }
      return 0;
    });

    const inputs = observations.map((row) =>
      factors.map((factor) => row[factor]).concat([row[this.selectedVariable]])
    );

    const coefficients = regression(inputs); //result : [const, coefficient_1, coefficient_2, ... coefficient_n] for function f(X) = 0.5X0 - 0.5X1 + contant
    this.multipleRegressionOutput = {
      variables: factors.map((factor) => {
        return {
          name: factor,
          factorName: `X${factors.indexOf(factor)}`,
          coefficient: coefficients[factors.indexOf(factor) + 1],
        };
      }),
      constant: coefficients[0],
    };

    setTimeout((_) => {
      const chartDiv = this.elementRef.nativeElement.querySelector(
        '.hs-statistics-multi-regression'
      );
      const chartHeight = chartDiv.parentElement.offsetHeight - 40;
      const chartData: any = {
        '$schema': 'https://vega.github.io/schema/vega/v5.json',
        'config': {'mark': {'tooltip': null}},
        'width': chartDiv.parentElement.offsetWidth - 40,
        'height': chartHeight,
        'autosize': {
          'type': 'fit',
          'contains': 'padding',
        },
        'data': [
          {
            'name': 'table',
            'values': observations,
          },
          {
            'name': 'predictions',
            'values': observations,
            'transform': [
              {
                'type': 'formula',
                'expr':
                  this.multipleRegressionOutput.variables
                    .map(
                      (col) => `datum.${col.factorName} * ${col.coefficient}`
                    )
                    .join('') + ` + ${this.multipleRegressionOutput.constant}`,
                'as': 'predicted_value',
              },
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
                {'data': 'table', 'field': 'time'},
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
                ...this.multipleRegressionOutput.variables.map((col) => {
                  return {'data': 'table', 'field': col.factorName};
                }),
                {'data': 'table', 'field': 'Y'}, //Dependant (predicted) variable from real dataset
                {'data': 'predictions', 'field': 'predicted_value'}, // Predicted by regression coefficients
              ],
            },
          },
          {
            'name': 'color',
            'type': 'ordinal',
            'range': 'category',
            'domain': this.multipleRegressionOutput.variables
              .map((col) => col.factorName)
              .concat(['Predicted Y', 'Observed Y']),
          },
        ],
        'axes': [
          {
            'orient': 'bottom',
            'scale': 'x',
            'labelPadding': 25,
            'labelAngle': -40,
            'labelOverlap': 'parity',
          },
          {'orient': 'left', 'scale': 'y'},
        ],
        'marks': this.multipleRegressionOutput.variables
          .map((col) => {
            return {
              from: {'data': 'table'},
              'type': 'symbol',
              'encode': {
                'enter': {
                  'stroke': {'scale': 'color', 'value': col.factorName},
                  'shape': {'value': 'diamond'},
                  'size': {'value': 30},
                  'strokeWidth': {'value': 1.5},
                },
                'update': {
                  'strokeOpacity': {'value': 1},
                  'x': {'scale': 'x', 'field': 'time'},
                  'y': {'scale': 'y', 'field': col.factorName},
                },
                'hover': {'strokeOpacity': {'value': 0.5}},
              },
            };
          })
          .concat({
            from: {'data': 'table'},
            'type': 'symbol',
            'encode': {
              'enter': {
                stroke: {scale: 'color', value: 'Observed Y'},
                shape: {value: 'diamond'},
                size: {value: 30},
                strokeWidth: {value: 1.5},
              },
              'update': {
                'strokeOpacity': {'value': 1},
                'x': {'scale': 'x', 'field': 'time'},
                'y': {'scale': 'y', 'field': 'Y'},
              },
              'hover': {'strokeOpacity': {'value': 0.5}},
            },
          })
          .concat([
            {
              'from': {
                'data': 'predictions',
              },
              'type': 'line',
              'encode': {
                'enter': {
                  'stroke': {
                    'scale': 'color',
                    'value': 'Predicted Y',
                  },
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
          ]),
        'legends': [
          {
            'fill': 'color',
            'encode': {
              'title': {
                'update': {
                  'fontSize': {'value': 14},
                },
              },
              'legend': {
                'update': {
                  'stroke': {'value': '#ccc'},
                  'strokeWidth': {'value': 1.5},
                },
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
    }, 0);
  }

  selectFilter(value: any): void {
    this.selectedLocation = value;
    this.visualize();
  }

  selectRegressionType(type) {
    this.selectedRegressionType = type;
  }

  async visualizeSimpleReg(col: ColumnWrapper): Promise<void> {
    setTimeout((_) => {
      const $index = this.colWrappers.indexOf(col);
      const factor = col.name;
      const {sample1, sample2} = this.hsStatisticsService.createShiftedSamples(
        factor,
        this.shifts,
        this.selectedVariable
      );
      const observations = [];
      for (let i = 0; i < sample1.length; i++) {
        const tmp = {};
        tmp[factor] = sample1[i];
        tmp[this.selectedVariable] = sample2[i];
        observations.push(tmp);
      }
      const inputData = observations.map((row) => {
        return [row[factor], row[this.selectedVariable]];
      });
      col.regressionOutput = linearRegression(inputData);
      const chartDiv = this.elementRef.nativeElement.querySelector(
        `${CHART_DIV}-${$index}`
      );
      if (!chartDiv) {
        //When predicted variable is also the factor
        return;
      }
      const chartData: any = {
        '$schema': 'https://vega.github.io/schema/vega-lite/v4.15.0.json',
        'config': {
          'mark': {
            'tooltip': null,
          },
        },
        'width': chartDiv.parentElement.offsetWidth - 40,
        'height': chartDiv.parentElement.offsetHeight - 40,
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
                'field': this.selectedVariable,
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
                'regression': this.selectedVariable,
                'on': factor,
              },
            ],
            'encoding': {
              'x': {
                'field': factor,
                'type': 'quantitative',
              },
              'y': {
                'field': this.selectedVariable,
                'type': 'quantitative',
              },
            },
          },
          {
            'transform': [
              {
                'regression': this.selectedVariable,
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
        vegaEmbed(chartDiv, chartData);
      } catch (ex) {
        console.warn('Could not create vega chart:', ex);
      }
    }, 0);
  }

  openPredictionDialog(predictedVariable: string, factor: ColumnWrapper): void {
    this.hsDialogContainerService.create(
      HsStatisticsPredictionChartDialogComponent,
      {
        predictedVariable,
        factor,
      }
    );
  }
}
