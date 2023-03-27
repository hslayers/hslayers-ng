import {ElementRef, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import dayjs from 'dayjs';
import objectSupport from 'dayjs/plugin/objectSupport';
import {HsLanguageService} from 'hslayers-ng';
import {HsLogService} from 'hslayers-ng';
import {HsUtilsService} from 'hslayers-ng';
import {default as vegaEmbed} from 'vega-embed';

import {Aggregate} from './types/aggregate.type';
import {HsSensorUnit} from './sensor-unit.class';
import {Interval} from './types/interval.type';
import {SensLogEndpoint} from './types/senslog-endpoint.type';

dayjs.extend(objectSupport);

@Injectable({
  providedIn: 'root',
})
export class HsSensorsUnitDialogService {
  unit: HsSensorUnit;
  unitDialogVisible: boolean;
  currentInterval: any;
  sensorsSelected = [];
  sensorIdsSelected = [];
  endpoint: SensLogEndpoint;
  observations: any;
  sensorById = {};
  dialogElement: ElementRef;
  aggregations: Aggregate[];
  intervals: Interval[] = [
    {name: '1H', amount: 1, unit: 'hours'},
    {name: '1D', amount: 1, unit: 'days'},
    {name: '1W', amount: 1, unit: 'weeks'},
    {name: '1M', amount: 1, unit: 'months'},
    {name: '6M', amount: 6, unit: 'months'},
  ];

  constructor(
    private http: HttpClient,
    private hsUtilsService: HsUtilsService,
    private hsLogService: HsLogService,
    private hsLanguageService: HsLanguageService
  ) {}

  /**
   * Select sensor from the list
   * @param sensor - Sensor selected
   
   */
  selectSensor(sensor: any) {
    this.sensorsSelected.forEach((s) => (s.checked = false));
    this.sensorsSelected = [sensor];
    this.sensorIdsSelected = [sensor.sensor_id];
  }

  /**
   * Toggle selected sensor
   * @param sensor - Sensor selected
   
   */
  toggleSensor(sensor) {
    if (sensor.checked) {
      this.sensorsSelected.push(sensor);
      this.sensorIdsSelected.push(sensor.sensor_id);
    } else {
      this.sensorsSelected.splice(this.sensorsSelected.indexOf(sensor), 1);
      this.sensorIdsSelected.splice(
        this.sensorIdsSelected.indexOf(sensor.sensor_id),
        1
      );
    }
  }

  /**
   * Get human readable time for interval value
   * @param interval - Interval selected
   */
  getTimeForInterval(interval): {from_time; to_time} {
    const tmp = {
      from_time: dayjs().subtract(interval.amount, interval.unit),
      to_time: dayjs(),
    };
    this.convertPartToDayjs('from', interval, tmp);
    this.convertPartToDayjs('to', interval, tmp);
    return tmp;
  }

  /**
   * @param part - Part selected
   * @param interval - Interval selected
   * @param result - Result value
   */
  private convertPartToDayjs(
    part: string,
    interval: any,
    result: {
      from_time;
      to_time;
    }
  ) {
    const dayjsTime = dayjs(interval[part + 'Time']);
    if (interval[part + 'Time'] != undefined) {
      if (
        interval[part + 'Time'].year &&
        interval[part + 'Time'].month &&
        interval[part + 'Time'].day
      ) {
        result[part + '_time'] = dayjsTime.subtract(1, 'month');
      } else {
        result[part + '_time'] = dayjsTime;
      }
    }
  }

  /**
   * @param unit - Object containing
   * {description, is_mobile, sensors, unit_id, unit_type}
   * @param interval - Object {amount, unit}. Used to substract time
   * from current time, like 6 months before now
   * Gets list of observations in a given time frame for all
   * the sensors on a sensor unit (meteostation).
   
   * @returns Promise which resolves when observation history data is received
   */
  getObservationHistory(unit, interval) {
    //TODO rewrite by spllitting getting the observable and subscribing to results in different functions
    return new Promise((resolve, reject) => {
      const url = this.hsUtilsService.proxify(
        `${this.endpoint.url}/${this.endpoint.liteApiPath}/rest/observation`
      );
      const time = this.getTimeForInterval(interval);
      const from_time = `${time.from_time.format(
        'YYYY-MM-DD'
      )} ${time.from_time.format('HH:mm:ssZ')}`;
      const to_time = `${time.to_time.format(
        'YYYY-MM-DD'
      )} ${time.to_time.format('HH:mm:ssZ')}`;
      interval.loading = true;
      this.http
        .get(
          `${url}?user_id=${encodeURIComponent(
            this.endpoint.user_id
          )}&unit_id=${unit.unit_id}&from_time=${encodeURIComponent(
            from_time
          )}&to_time=${encodeURIComponent(to_time)}`
        )
        .subscribe({
          next: (response) => {
            interval.loading = false;
            this.observations = response;
            resolve(null);
          },
          error: (err) => {
            reject(err);
          },
        });
    });
  }

  /**
   * @param unit - Unit description
   
   * Create vega chart definition and use it in vegaEmbed
   * chart library. Observations for a specific unit from Senslog come
   * in a hierarchy, where 1st level contains object with timestamp and
   * for each timestamp there exist multiple sensor observations for
   * varying count of sensors. This nested list is flatened to simple
   * array of objects with {sensor_id, timestamp, value, sensor_name}
   */
  createChart(unit) {
    let sensorDesc = unit.sensors.filter(
      (s) => this.sensorIdsSelected.indexOf(s.sensor_id) > -1
    );
    if (sensorDesc.length > 0) {
      sensorDesc = sensorDesc[0];
    }
    const observations = this.observations.reduce(
      (acc, val) =>
        acc.concat(
          val.sensors
            .filter((s) => this.sensorIdsSelected.indexOf(s.sensor_id) > -1)
            .map((s) => {
              const time = dayjs(val.time_stamp);
              s.sensor_name = this.translate(
                this.sensorById[s.sensor_id].sensor_name_translated,
                'SENSORNAMES'
              );
              s.time = time.format('DD.MM.YYYY HH:mm');
              s.time_stamp = time.toDate();
              return s;
            })
        ),
      []
    );
    this.aggregations = this.calculateAggregates(unit, observations);
    observations.sort((a, b) => {
      if (a.time_stamp > b.time_stamp) {
        return 1;
      }
      if (b.time_stamp > a.time_stamp) {
        return -1;
      }
      return 0;
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
        this.dialogElement.nativeElement.querySelector('.hs-chartplace')
          .parentElement.offsetWidth - 40,
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
      'encoding': {
        'color': {
          'field': 'sensor_name',
          'legend': {
            'title': this.hsLanguageService.getTranslation('SENSORS.sensors'),
          },
          'type': 'nominal',
          'sort': 'sensor_id',
        },
        'x': {
          'axis': {
            'title': 'Timestamp',
            'labelOverlap': true,
          },
          'field': 'time_stamp',
          'sort': false,
          'type': 'temporal',
        },
        'y': {
          'axis': {
            'title': `${this.translate(
              sensorDesc.phenomenon_name,
              'PHENOMENON'
            )} ${sensorDesc.uom}`,
          },
          'field': 'value',
          'type': 'quantitative',
        },
      },
      'mark': {'type': 'line', 'tooltip': {'content': 'data'}},
      'selection': {
        'selector016': {
          'bind': 'scales',
          'encodings': ['x', 'y'],
          'type': 'interval',
        },
      },
    };
    try {
      vegaEmbed(
        this.dialogElement.nativeElement.querySelector('.hs-chartplace'),
        chartData
      );
    } catch (ex) {
      this.hsLogService.warn('Could not create vega chart:', ex);
    }
  }

  /**
   * @param unit - Unit description
   * @param observations - Observations selected
   
   * Calculate aggregates for selected unit
   */
  private calculateAggregates(unit: any, observations: any): Aggregate[] {
    const aggregates: Aggregate[] = unit.sensors
      .filter((s) => this.sensorIdsSelected.indexOf(s.sensor_id) > -1)
      .map((sensor): Aggregate => {
        const tmp: Aggregate = {
          min: 0,
          max: 0,
          avg: 0,
          sensor_id: sensor.sensor_id,
          sensor_name: sensor.sensor_name_translated,
        };
        const filteredObs = observations
          .filter((obs) => obs.sensor_id == sensor.sensor_id)
          .map((obs) => {
            return {value: obs.value, time: obs.time_stamp};
          });
        tmp.max = Math.max(
          ...filteredObs.map((o) => {
            return o.value;
          })
        );
        tmp.min = Math.min(
          ...filteredObs.map((o) => {
            return o.value;
          })
        );
        tmp.avg =
          filteredObs.reduce((p, c) => p + c.value, 0) / filteredObs.length;
        tmp.avg = Math.round(tmp.avg * Math.pow(10, 2)) / Math.pow(10, 2);
        return tmp;
      });
    return aggregates;
  }

  translate(text: string, group?: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(
      'SENSORS' + (group != undefined ? '.' + group : ''),
      text
    );
  }
}
