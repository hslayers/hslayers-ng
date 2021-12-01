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
  clone(observations) {
    return observations.map((o) => {
      const tmp = {};
      Object.assign(tmp, o);
      return tmp;
    });
  }
  visualizeMulti() {
    const factors = this.colWrappers
      .filter((col) => col.checked && col.name !== this.selectedVariable)
      .map((col) => col.name);

    //Get temporal shifted observations where all values present in a specific year even after shifting
    const {samples, sampleKeys} = this.hsStatisticsService.createShiftedSamples(
      [...factors, this.selectedVariable],
      this.shifts
    );

    let coefficients;
    if (samples[0].length == 0) {
      coefficients = [0, ...factors.map((_) => 0)];
    } else {
      coefficients = regression(
        [...Array(samples[0].length).keys()].map(
          (
            i // Loop & map from 0 to sample length - 1
          ) =>
            factors
              .map((factor) => samples[factors.indexOf(factor)][i]) // Factors
              .concat([samples[samples.length - 1][i]]) // Predictor
        )
      ); //result : [const, coefficient_1, coefficient_2, ... coefficient_n] for function f(X) = 0.5X0 - 0.5X1 + constant
    }

    const observations = Object.keys(this.hsStatisticsService.corpus.dict)
      .map((key) => {
        const tmp: any = {};
        const row = this.hsStatisticsService.corpus.dict[key];
        Object.assign(tmp, row.values);
        tmp.key = row.location + row.time;
        //Key is a composite of location and time, thus we need to store also the parts separated to calculate shift
        tmp.location = row.location;
        tmp.time = row.time;
        tmp[`Y`] = tmp[this.selectedVariable];
        for (const variable of factors) {
          if (
            tmp[variable] === null ||
            tmp[variable] == undefined ||
            isNaN(tmp[variable])
          ) {
            return;
          }
          tmp[`X${factors.indexOf(variable)}`] = tmp[variable];
        }
        return tmp;
      })
      .filter((o) => o); //Only valid ones

    observations.sort((a: any, b: any) => {
      if (a.key > b.key) {
        return 1;
      }
      if (b.key > a.key) {
        return -1;
      }
      return 0;
    });

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
      const regressionVars = this.multipleRegressionOutput.variables;
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
          ...this.multipleRegressionOutput.variables.map((col) => {
            return {
              'name': 'real' + col.factorName,
              'values': this.clone(observations),
            };
          }),
          {
            'name': 'realY',
            'values': this.clone(observations),
          },
          {
            'name': 'predictions',
            'values': this.clone(observations),
            'transform': [
              ...regressionVars.map((col) => {
                return {
                  type: 'formula',
                  expr: `datum.time ${
                    this.shifts[col.name] < 0 ? this.shifts[col.name] : ''
                  }`,
                  as: 'shifted_year' + col.factorName,
                };
              }),
              ...regressionVars.map((col) => {
                return {
                  type: 'formula',
                  expr: `datum.location + datum.${
                    'shifted_year' + col.factorName
                  }`,
                  as: 'shifted_key' + col.factorName,
                };
              }),
              ...regressionVars.map((col) => {
                return {
                  'type': 'lookup',
                  'from': 'real' + col.factorName,
                  'key': 'key',
                  'fields': ['shifted_key' + col.factorName],
                  'values': [col.factorName],
                  'as': ['shiftedReal' + col.factorName],
                };
              }),
              {
                'type': 'formula',
                'expr':
                  regressionVars
                    .map(
                      (col) =>
                        `datum.shiftedReal${col.factorName} * ${col.coefficient}`
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
                ...regressionVars.map((col) => {
                  return {
                    'data': 'real' + col.factorName,
                    'field': 'key',
                  };
                }),
                {'data': 'predictions', 'field': 'key'},
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
                ...regressionVars.map((col) => {
                  return {
                    'data': 'real' + col.factorName,
                    'field': col.factorName,
                  };
                }),
                {'data': 'realY', 'field': 'Y'}, //Dependant (predicted) variable from real dataset
                {'data': 'predictions', 'field': 'predicted_value'}, // Predicted by regression coefficients
              ],
            },
          },
          {
            'name': 'color',
            'type': 'ordinal',
            'range': 'category',
            'domain': regressionVars
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
        'marks': regressionVars
          .map((col) => {
            return {
              from: {'data': 'real' + col.factorName},
              'type': 'symbol',
              'encode': {
                'enter': {
                  'tooltip': {'field': col.factorName},
                  'stroke': {'scale': 'color', 'value': col.factorName},
                  'shape': {'value': 'diamond'},
                  'size': {'value': 30},
                  'strokeWidth': {'value': 1.5},
                },
                'update': {
                  'strokeOpacity': {'value': 1},
                  'x': {'scale': 'x', 'field': 'key'},
                  'y': {'scale': 'y', 'field': col.factorName},
                },
                'hover': {'strokeOpacity': {'value': 0.5}},
              },
            };
          })
          .concat(
            regressionVars.map((col) => {
              return {
                from: {'data': 'real' + col.factorName},
                'type': 'symbol',
                'encode': {
                  'enter': {
                    'tooltip': {'field': 'Y'},
                    stroke: {scale: 'color', value: 'Observed Y'},
                    shape: {value: 'diamond'},
                    size: {value: 30},
                    strokeWidth: {value: 1.5},
                  },
                  'update': {
                    'strokeOpacity': {'value': 1},
                    'x': {'scale': 'x', 'field': 'key'},
                    'y': {'scale': 'y', 'field': 'Y'},
                  },
                  'hover': {'strokeOpacity': {'value': 0.5}},
                },
              };
            })
          )
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
                  'x': {'scale': 'x', 'field': 'key'},
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
    if (!this.selectedVariable) {
      return;
    }
    setTimeout((_) => {
      const $index = this.colWrappers.indexOf(col);
      const factor = col.name;
      const {samples} = this.hsStatisticsService.createShiftedSamples(
        [factor, this.selectedVariable],
        this.shifts
      );
      const observations = [];
      for (let i = 0; i < samples[0].length; i++) {
        const tmp = {};
        tmp[factor] = samples[0][i];
        tmp[this.selectedVariable] = samples[1][i];
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
              'tooltip': true,
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
        shifts: this.shifts,
      }
    );
  }
}
