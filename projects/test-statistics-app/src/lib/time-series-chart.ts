import {Component, ElementRef, Input, OnChanges, ViewRef} from '@angular/core';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {default as vegaEmbed} from 'vega-embed';

import {
  HsDialogContainerService,
  HsLanguageService,
  HsLayerUtilsService,
} from 'hslayers-ng';

dayjs.extend(utc);
const CHART_DIV = '.hs-statistics-timeseries';
@Component({
  selector: 'hs-time-series-chart',
  templateUrl: './time-series-chart.component.html',
})
export class HsStatisticsTimeSeriesChartComponent implements OnChanges {
  @Input() observations: {
    name: string;
    time: string | number;
    time_stamp?: string | Date;
    value: null;
  }[];

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsLayerUtilsService: HsLayerUtilsService,
    private HsLanguageService: HsLanguageService,
    private elementRef: ElementRef
  ) {}

  ngOnChanges(): void {
    if (this.observations) {
      this.visualize();
    }
  }

  async visualize(): Promise<void> {
    for (const o of this.observations) {
      if (o.time_stamp == undefined) {
        try {
          const time = dayjs(o.time);
          o.time_stamp = time.toDate().toISOString();
        } catch (ex) {}
      }
    }
    this.observations.sort((a, b) => {
      if (a.time_stamp > b.time_stamp) {
        return 1;
      }
      if (b.time_stamp > a.time_stamp) {
        return -1;
      }
      return 0;
    });

    const toolTipVariables = this.observations
      ?.map((ob) => ob.name)
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
        'data-062c25e80e0ff23df3803082d5c6f7e7': this.observations,
      },
      'transform': [{type: 'formula', expr: 'datum.value * 2', 'as': 'val2'}],
      'layer': [
        {
          'encoding': {
            'color': {
              'field': 'name',
              'legend': {
                'labelLimit': 500,
                'orient': 'top',
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
              'timeUnit': 'year',
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
