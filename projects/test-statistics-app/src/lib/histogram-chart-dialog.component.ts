import {Component, ElementRef, Input, OnInit, ViewRef} from '@angular/core';

import {
  HsDialogComponent,
  HsDialogContainerService,
  HsLanguageService,
} from 'hslayers-ng';
import {default as vegaEmbed} from 'vega-embed';

const CHART_DIV = '.hs-statistics-histogram';
export type HistogramData = {
  interval: string;
  frequency: number;
};
@Component({
  selector: 'hs-histogram-chart-dialog',
  templateUrl: './histogram-chart-dialog.component.html',
})
export class HsStatisticsHistogramComponent
  implements HsDialogComponent, OnInit {
  viewRef: ViewRef;
  descStat: {
    median: number;
    modes: string;
    mean: number;
    meanAbsoluteDeviation: number;
    variance: number;
    standardDeviation: number;
    pearsonCoefficient: number;
  };
  histogram: HistogramData[] = [];
  @Input() data: {
    filteredValues: any[];
    selectedTime: any;
    min: number;
    max: number;
    selectedVariable: string;
  };
  constructor(
    public hsDialogContainerService: HsDialogContainerService,
    private elementRef: ElementRef,
    public hsLanguageService: HsLanguageService
  ) {}
  ngOnInit(): void {
    if (this.isDataLoaded()) {
      this.setToDefault();
      this.executeCalculations();
      this.visualize();
    }
  }

  isDataLoaded(): boolean {
    return this.data.filteredValues.length > 0;
  }

  setToDefault(): void {
    this.descStat = {
      median: 0,
      modes: '',
      mean: 0,
      meanAbsoluteDeviation: 0,
      variance: 0,
      standardDeviation: 0,
      pearsonCoefficient: 0,
    };
  }

  executeCalculations(): void {
    this.descStat.mean = this.calculateMean(this.data.filteredValues);
    this.calculateVariance(this.data.filteredValues, this.descStat.mean);
    this.calculateMedian(this.data.filteredValues);
    this.calculateMode(this.data.filteredValues);
    this.calculateMeanAbsoluteDeviation(this.data.filteredValues);
    this.calculateSD();
    this.calculatePearsonCoefficient(
      this.descStat.mean,
      this.descStat.median,
      this.descStat.standardDeviation
    );
  }
  close(): void {
    this.hsDialogContainerService.destroy(this);
  }

  visualize(): void {
    const chartDiv = this.elementRef.nativeElement.querySelector(CHART_DIV);
    this.findAndSetIntervals();
    const width = chartDiv.parentElement.offsetWidth - 40;
    const height = chartDiv.parentElement.offsetHeight - 40;

    const chartData: any = {
      '$schema': 'https://vega.github.io/schema/vega/v5.json',
      'width': width,
      'height': height,
      'autosize': {
        'type': 'fit',
        'contains': 'padding',
      },
      'config': {
        'axis': {
          'labelColor': 'black',
          'labelFontSize': 10,
          'titleFontSize': 16,
          'titleFontWeight': '600',
        },
      },
      'data': [
        {
          'name': 'table',
          'values': this.histogram,
        },
      ],
      'signals': [
        {
          'name': 'tooltip',
          'value': {},
          'on': [
            {'events': 'rect:mouseover', 'update': 'datum'},
            {'events': 'rect:mouseout', 'update': '{}'},
          ],
        },
      ],

      'scales': [
        {
          'name': 'xscale',
          'type': 'band',
          'range': 'width',
          'domain': {'data': 'table', 'field': 'interval'},
          'round': true,
          'padding': 0.1,
        },
        {
          'name': 'yscale',
          'range': 'height',
          'domain': {'data': 'table', 'field': 'frequency'},
          'nice': true,
        },
      ],

      'axes': [
        {
          'orient': 'bottom',
          'scale': 'xscale',
          'bandPosition': 0.5,
          'title': this.hsLanguageService.getTranslation(
            'STATISTICS.INTERVALS'
          ),
          'labelAngle': 15,
          'labelBaseline': 'line-top',
          'titleY': 40,
        },
        {
          'orient': 'left',
          'scale': 'yscale',
          'title': this.hsLanguageService.getTranslation(
            'STATISTICS.FREQUENCY'
          ),
          'tickMinStep': 1,
        },
      ],

      'marks': [
        {
          'type': 'rect',
          'from': {'data': 'table'},
          'encode': {
            'enter': {
              'x': {'scale': 'xscale', 'field': 'interval'},
              'width': {'scale': 'xscale', 'band': 1},
              'y': {'scale': 'yscale', 'field': 'frequency'},
              'y2': {'scale': 'yscale', 'value': 0},
            },
            'update': {
              'fill': {'value': 'steelblue'},
              'fillOpacity': {'value': 0.4},
            },
            'hover': {'fill': {'value': 'red'}},
          },
        },
        {
          'type': 'line',
          'from': {'data': 'table'},
          'encode': {
            'enter': {
              'interpolate': {'value': 'monotone'},
              'x': {'scale': 'xscale', 'field': 'interval', 'offset': 30},
              'y': {'scale': 'yscale', 'field': 'frequency'},
              'stroke': {'value': 'goldenrod'},
              'strokeWidth': {'value': 2},
            },
          },
        },
        {
          'type': 'text',
          'encode': {
            'enter': {
              'align': {'value': 'center'},
              'baseline': {'value': 'top'},
              'fill': {'value': 'black'},
              'fontSize': {'value': 12},
              'fontWeight': {'value': '600'},
            },
            'update': {
              'x': {
                'scale': 'xscale',
                'signal': 'tooltip.interval',
                'band': 0.5,
              },
              'y': {
                'scale': 'yscale',
                'signal': 'tooltip.frequency',
                'offset': -2,
              },
              'text': {'signal': 'tooltip.frequency'},
              'fillOpacity': [
                {'test': 'isNaN(tooltip.frequency)', 'value': 0},
                {'value': 1},
              ],
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

  findAndSetIntervals(): void {
    const intervalWidth = Math.ceil((this.data.max - this.data.min) / 10);
    let intervalStart = 1;
    let intervalEnd = intervalWidth;
    for (let i = 0; i < 10; i++) {
      let freqCount = 0;
      this.data.filteredValues.forEach((val) => {
        if (val > intervalStart && val < intervalEnd) {
          freqCount++;
        }
      });
      this.histogram.push({
        interval: `${intervalStart}-${intervalEnd}`,
        frequency: freqCount,
      });
      intervalStart += intervalWidth;
      intervalEnd += intervalWidth;
    }
  }

  calculateMedian(values: number[]): void {
    const sortedValues = values.sort((a, b) => a - b);
    const arrLength = sortedValues.length;
    if (length % 2 === 0) {
      this.descStat.median =
        (sortedValues[Math.ceil(arrLength / 2 - 1)] +
          sortedValues[Math.ceil(arrLength / 2)]) /
        2;
    } else {
      this.descStat.median = sortedValues[(arrLength - 1) / 2];
    }
  }

  calculateMean(values: number[]): number {
    return values.reduce((sum, current) => sum + current) / values.length;
  }

  calculateVariance(values: number[], mean: number): void {
    const squareDiffs = values.map((value: number): number => {
      const diff = value - mean;
      return diff * diff;
    });
    this.descStat.variance =
      squareDiffs.reduce((sum, current) => sum + current) / (values.length - 1);
  }

  calculateSD(): void {
    this.descStat.standardDeviation = Math.sqrt(this.descStat.variance);
  }
  // Calculate mode https://jonlabelle.com/snippets/view/javascript/calculate-mean-median-mode-and-range-in-javascript
  calculateMode(values: number[]): void {
    const count = [];
    const modes = [];
    let maxIndex = 0;
    let number = 0;
    values.forEach((val) => {
      number = val;
      count[number] = (count[number] || 0) + 1;
      if (count[number] > maxIndex) {
        maxIndex = count[number];
      }
    });

    for (const i in count) {
      if (count.hasOwnProperty(i)) {
        if (count[i] === maxIndex && maxIndex > 1) {
          modes.push(Number(i));
        }
      }
    }

    this.descStat.modes = modes.length > 0 ? modes.toString() : 'None';
  }

  calculateMeanAbsoluteDeviation(values: number[]): void {
    this.descStat.meanAbsoluteDeviation =
      values.reduce((sum, current) => sum + (current - this.descStat.mean)) /
      values.length;
  }

  /**
   * Pearson 's offset coefficient measures the difference between the arithmetic mean of the standard deviation.
   * In a normal distribution, the Pearson coefficient is always 0. For a positively shifted distribution, it is positive, for a negatively shifted negative.
   */
  calculatePearsonCoefficient(
    mean: number,
    median: number,
    standardDeviation: number
  ): void {
    if (mean && median && standardDeviation) {
      this.descStat.pearsonCoefficient =
        (3 * (mean - median)) / standardDeviation;
    }
  }
}
