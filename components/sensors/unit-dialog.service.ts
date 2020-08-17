/* eslint-disable angular/definedundefined */
import '../utils/string-modifications';
import {HsUtilsService} from '../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import moment = require('moment');
import {HsConfig} from '../../config.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsSensorUnit} from './sensor-unit.class';
import {default as vegaEmbed} from 'vega-embed';

@Injectable({
  providedIn: 'root',
})
export class HsSensorsUnitDialogService {
  unit: HsSensorUnit;
  unitDialogVisible: boolean;
  currentInterval: any;
  sensorsSelected = [];
  sensorIdsSelected = [];
  endpoint: any;
  observations: any;
  sensorById = {};
  intervals = [
    {name: '1H', amount: 1, unit: 'hours'},
    {name: '1D', amount: 1, unit: 'days'},
    {name: '1W', amount: 1, unit: 'weeks'},
    {name: '1M', amount: 1, unit: 'months'},
    {name: '6M', amount: 6, unit: 'months'},
  ];

  constructor(
    private http: HttpClient,
    private HsUtilsService: HsUtilsService,
    private HsLogService: HsLogService,
    private HsConfig: HsConfig,
    private HsLayoutService: HsLayoutService
  ) {
    this.endpoint = this.HsConfig.senslog;
  }

  selectSensor(sensor: any) {
    this.sensorsSelected.forEach((s) => (s.checked = false));
    this.sensorsSelected = [sensor];
    this.sensorIdsSelected = [sensor.sensor_id];
  }

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

  getTimeForInterval(interval) {
    if (interval.fromTime != undefined) {
      if (
        interval.fromTime.year &&
        interval.fromTime.month &&
        interval.fromTime.day
      ) {
        return moment(interval.fromTime).subtract(1, 'month');
      } else {
        return moment(interval.fromTime);
      }
    } else {
      return moment().subtract(interval.amount, interval.unit);
    }
  }

  /**
   * @memberof HsSensorsService
   * @function getObservationHistory
   * @param {object} unit Object containing
   * {description, is_mobile, sensors, unit_id, unit_type}
   * @param {object} interval Object {amount, unit}. Used to substract time
   * from current time, like 6 months before now
   * @description Gets list of observations in a given time frame for all
   * the sensors on a sensor unit (meteostation).
   * @returns {Promise} Promise which resolves when observation history data is received
   */
  getObservationHistory(unit, interval) {
    //TODO rewrite by spllitting getting the observable and subscribing to results in different functions
    return new Promise((resolve, reject) => {
      const url = this.HsUtilsService.proxify(
        `${this.endpoint.url}/senslog-lite/rest/observation`
      );
      const time = this.getTimeForInterval(interval);
      const from_time = `${time.format('YYYY-MM-DD')} ${time.format(
        'HH:mm:ssZ'
      )}`;
      interval.loading = true;
      this.http
        .get(
          `${url}?user_id=${encodeURIComponent(
            this.endpoint.user_id
          )}&unit_id=${unit.unit_id}&from_time=${encodeURIComponent(from_time)}`
        )
        .subscribe(
          (response) => {
            interval.loading = false;
            this.observations = response;
            resolve();
          },
          (err) => {
            reject(err);
          }
        );
    });
  }

  /**
   * @memberof HsSensorsService
   * @function createChart
   * @param {object} unit Unit description
   * @description Create vega chart definition and use it in vegaEmbed
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
              const time = moment(val.time_stamp);
              s.sensor_name = this.sensorById[s.sensor_id].sensor_name;
              s.time = time.format('DD.MM.YYYY HH:mm');
              s.time_stamp = time.toDate();
              return s;
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
    //See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat for flattening array
    const chartData: any = {
      '$schema': 'https://vega.github.io/schema/vega-lite/v4.0.2.json',
      'HsConfig': {
        'mark': {
          'tooltip': null,
        },
      },
      'width':
        this.HsLayoutService.contentWrapper.querySelector('.hs-chartplace')
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
            'title': 'Sensor',
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
            'title': `${sensorDesc.phenomenon_name} ${sensorDesc.uom}`,
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
        this.HsLayoutService.contentWrapper.querySelector('.hs-chartplace'),
        chartData
      );
    } catch (ex) {
      this.HsLogService.warn('Could not create vega chart:', ex);
    }
  }
}
