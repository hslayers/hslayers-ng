import {ElementRef, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import dayjs from 'dayjs';
import objectSupport from 'dayjs/plugin/objectSupport';
import {HsLanguageService, HsLogService, HsUtilsService} from 'hslayers-ng';
import {default as vegaEmbed} from 'vega-embed';

import {Aggregate} from './types/aggregate.type';
import {BehaviorSubject} from 'rxjs';
import {HsSensorUnit} from './sensor-unit.class';
import {Interval} from './types/interval.type';
import {SensLogEndpoint} from './types/senslog-endpoint.type';

dayjs.extend(objectSupport);

export class Aggregates {
  [key: string]: Aggregate[];
}

class SensorsUnitDialogServiceParams {
  unit: HsSensorUnit[] = [];
  unitDialogVisible: boolean;
  currentInterval: any;
  sensorsSelected = [];
  sensorIdsSelected = [];
  endpoint: SensLogEndpoint;
  observations: any;
  sensorById = {};
  dialogElement: ElementRef;
  aggregations: Aggregates = {};
  intervals: Interval[] = [
    {name: '1H', amount: 1, unit: 'hours'},
    {name: '1D', amount: 1, unit: 'days'},
    {name: '1W', amount: 1, unit: 'weeks'},
    {name: '1M', amount: 1, unit: 'months'},
    {name: '6M', amount: 6, unit: 'months'},
  ];

  timeFormat: 'HH:mm:ss' | 'HH:mm:ssZ';
  useTimeZone = new BehaviorSubject<boolean>(false);

  /**
   * Controls whether it's possible to compare sensors in between
   * different sensor units
   */
  comparisonAllowed = false;
}

@Injectable({
  providedIn: 'root',
})
export class HsSensorsUnitDialogService {
  apps: {
    [id: string]: SensorsUnitDialogServiceParams;
  } = {default: new SensorsUnitDialogServiceParams()};
  constructor(
    private http: HttpClient,
    private hsUtilsService: HsUtilsService,
    private hsLogService: HsLogService,
    private hsLanguageService: HsLanguageService
  ) {}

  init(app: string): void {
    const appRef = this.get(app);
    appRef.useTimeZone.subscribe((value) => {
      appRef.timeFormat = value ? 'HH:mm:ssZ' : 'HH:mm:ss';
    });
  }

  /**
   * Get the params saved by the sensors unit dialog service for the current app
   * @param app - App identifier
   */
  get(app: string): SensorsUnitDialogServiceParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new SensorsUnitDialogServiceParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * Select sensor from the list
   * @param sensor - Sensor selected
   * @param app - App identifier
   */
  selectSensor(sensor: any, app: string) {
    const appRef = this.get(app);
    appRef.sensorsSelected.forEach((s) => (s.checked = false));
    appRef.sensorsSelected = [sensor];
    appRef.sensorIdsSelected = [sensor.sensor_id];
  }

  /**
   * Toggle selected sensor
   * @param sensor - Sensor selected
   * @param app - App identifier
   */
  toggleSensor(sensor, app: string) {
    const appRef = this.get(app);
    if (sensor.checked) {
      appRef.sensorsSelected.push(sensor);
      appRef.sensorIdsSelected.push(sensor.sensor_id);
    } else {
      appRef.sensorsSelected.splice(appRef.sensorsSelected.indexOf(sensor), 1);
      appRef.sensorIdsSelected.splice(
        appRef.sensorIdsSelected.indexOf(sensor.sensor_id),
        1
      );
    }
  }

  /**
   * Get time from picked interval [D,W,M,6M]
   */
  getTimeFromUnitAndAmount(interval) {
    const tmp = {
      from_time: dayjs().subtract(interval.amount, interval.unit),
      to_time: dayjs(),
    };
    this.convertPartToDayjs('from', interval, tmp);
    this.convertPartToDayjs('to', interval, tmp);
    return tmp;
  }

  dayJsFromPartials(dateObj) {
    return dayjs()
      .set('year', dateObj.year)
      .set('month', dateObj.month - 1) // Month in Day.js is zero-based (0-11)
      .set('date', dateObj.day);
  }

  /**
   * Get time picked from calendar
   */
  getTimeFromCalendarDate(interval) {
    const fromTime =
      interval.fromTime instanceof Date
        ? dayjs(interval.fromTime)
        : this.dayJsFromPartials(interval.fromTime);
    const to_time =
      interval.toTime instanceof Date
        ? dayjs(interval.toTime)
        : this.dayJsFromPartials(interval.toTime);
    return {
      from_time: fromTime,
      to_time: to_time,
    };
  }

  /**
   * Get human readable time for interval value
   * @param interval - Interval selected
   */
  getTimeForInterval(interval): {from_time; to_time} {
    if (!interval.amount && !interval.unit) {
      return this.getTimeFromCalendarDate(interval);
    } else {
      return this.getTimeFromUnitAndAmount(interval);
    }
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
   * Modify observation sensors sensor_id to match the one used throughout the app
   * eg. unit_id_sensor_id which makes every sensor unit specific
   */
  private modifyObservationHistory(response: Array<any>) {
    return response.map((observation) => {
      observation.sensors.forEach((s) => {
        s.sensor_id = `${observation.unit_id}_${s.sensor_id}`;
      });
      return observation;
    });
  }

  /**
   * Filter out osbervations belonging to deselected sensor unit
   */
  filterObservations(unit, app: string): void {
    const appRef = this.get(app);
    appRef.observations = appRef.observations.filter(
      (o) => o.unit_id !== unit.unit_id
    );
  }

  /**
   * @param unit - Object containing
   * {description, is_mobile, sensors, unit_id, unit_type}
   * @param interval - Object {amount, unit}. Used to substract time
   * from current time, like 6 months before now
   * Gets list of observations in a given time frame for all
   * the sensors on a sensor unit (meteostation).
   * @param app - App identifier
   * @returns Promise which resolves when observation history data is received
   */
  getObservationHistory(unit, interval, app: string): Promise<boolean> {
    const appRef = this.get(app);
    //TODO rewrite by spllitting getting the observable and subscribing to results in different functions
    return new Promise((resolve, reject) => {
      const url = this.hsUtilsService.proxify(
        `${appRef.endpoint.url}/${appRef.endpoint.liteApiPath}/rest/observation`,
        app
      );
      const time = this.getTimeForInterval(interval);
      const from_time = `${time.from_time.format(
        'YYYY-MM-DD'
      )} ${time.from_time.format(appRef.timeFormat)}`;
      const to_time = `${time.to_time.format(
        'YYYY-MM-DD'
      )} ${time.to_time.format(appRef.timeFormat)}`;
      interval.loading = true;
      this.http
        .get(
          `${url}?user_id=${encodeURIComponent(
            appRef.endpoint.user_id
          )}&unit_id=${unit.unit_id}&from_time=${encodeURIComponent(
            from_time
          )}&to_time=${encodeURIComponent(to_time)}`
        )
        .subscribe({
          next: (response: Array<any>) => {
            interval.loading = false;
            if (appRef.comparisonAllowed && appRef.unit.length > 1) {
              appRef.observations = [
                ...appRef.observations,
                ...this.modifyObservationHistory(response),
              ];
            } else {
              appRef.observations = this.modifyObservationHistory(response);
            }
            resolve(true);
          },
          error: (err) => reject(err),
        });
    });
  }

  private getSensorDescriptor(unit, app: string) {
    const appRef = this.get(app);
    let sensorDesc = unit.sensors.filter(
      (s) => appRef.sensorIdsSelected.indexOf(s.sensor_id) > -1
    );
    if (sensorDesc.length > 0 && !appRef.comparisonAllowed) {
      sensorDesc = sensorDesc[0];
    }
    return sensorDesc;
  }

  private getObservations(app: string) {
    const appRef = this.get(app);
    return appRef.observations.reduce((acc, val) => {
      return acc.concat(
        val.sensors
          .filter((s) => appRef.sensorIdsSelected.includes(s.sensor_id))
          .map((s) => {
            const time = dayjs(val.time_stamp);
            s.sensor_name = `${this.translate(
              appRef.sensorById[s.sensor_id].sensor_name_translated,
              'SENSORNAMES'
            )}_${val.unit_id}`;
            s.time = time.format('DD.MM.YYYY HH:mm');
            s.unit_id = val.unit_id;
            s.time_stamp = time.toDate();
            return s;
          })
      );
    }, []);
  }

  private getLayerSpecificEncoding() {
    return {
      'color': {
        'field': 'sensor_name',
        'legend': {
          'title': this.hsLanguageService.getTranslation('SENSORS.sensors'),
          'labelExpr': "split(datum.value, '_')[0]",
        },
        'type': 'nominal',
        'sort': 'sensor_id',
      },
      'x': {
        'axis': {
          'title': 'Timestamp',
          'labelOverlap': true,
          'titleAnchor': 'middle',
        },
        'field': 'time_stamp',
        'sort': false,
        'type': 'temporal',
      },
    };
  }

  createChartLayer(sensorDesc, multi = false) {
    let title = this.translate('noSensorsSelected');
    if (Array.isArray(sensorDesc) && sensorDesc.length > 0) {
      if (
        sensorDesc.length == 0 ||
        [...new Set(sensorDesc.map((obj) => obj.sensor_type))].length == 1
      ) {
        title = `${this.translate(
          sensorDesc[0].phenomenon_name,
          'PHENOMENON'
        )} ${sensorDesc[0].uom}`;
      } else {
        title = `${this.translate('multipleUnits')} [${[
          ...new Set(sensorDesc.map((obj) => obj.uom)),
        ].join(',')}]`;
      }
    } else if (sensorDesc.sensor_id) {
      title = multi
        ? sensorDesc.uom
        : `${this.translate(sensorDesc.phenomenon_name, 'PHENOMENON')} ${
            sensorDesc.uom
          }`;
    }
    const layer = {
      'encoding': {
        'y': {
          'axis': {
            'title': title,
            'titleAnchor': 'end',
            'titleLimit': 145,
          },
          'field': 'value',
          'type': 'quantitative',
          'scale': {'zero': false, 'nice': 5},
        },
      },
      'mark': {'type': 'line', 'tooltip': {'content': 'data'}},
    };
    if (multi) {
      layer['transform'] = [
        {
          'filter': `datum.sensor_name === '${sensorDesc.sensor_name}_${sensorDesc.unit_id}'`,
        },
      ];
    } else {
      layer.encoding = {
        ...layer.encoding,
        ...this.getLayerSpecificEncoding(),
      };
    }
    return layer;
  }

  getCommonChartDefinitionPart(observations, app: string) {
    const appRef = this.get(app);
    //See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat for flattening array
    return {
      '$schema': 'https://vega.github.io/schema/vega-lite/v4.15.0.json',
      'config': {
        'mark': {
          'tooltip': null,
        },
      },
      'width':
        appRef.dialogElement.nativeElement.querySelector('.hs-chartplace')
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
      'selection': {
        'selector016': {
          'bind': 'scales',
          'encodings': ['x', 'y'],
          'type': 'interval',
        },
      },
      'encoding': this.getLayerSpecificEncoding(),
    } as any;
  }

  /**
   * @param unit - Unit description
   * @param app - App identifier
   * Create vega chart definition and use it in vegaEmbed
   * chart library. Observations for a specific unit from Senslog come
   * in a hierarchy, where 1st level contains object with timestamp and
   * for each timestamp there exist multiple sensor observations for
   * varying count of sensors. This nested list is flatened to simple
   * array of objects with {sensor_id, timestamp, value, sensor_name}
   */
  createChart(unit, app: string) {
    unit = Array.isArray(unit) ? (unit.length > 1 ? unit : unit[0]) : unit;
    const appRef = this.get(app);

    let observations;
    let chartData;
    //Layered multi unit sensor view
    if (Array.isArray(unit)) {
      //Array holdiding every chart layer object
      const layer = [];
      observations = this.getObservations(app);

      unit.forEach((u) => {
        const sensorDesc = this.getSensorDescriptor(u, app);
        if (Array.isArray(sensorDesc)) {
          sensorDesc.forEach((sd) =>
            layer.push(this.createChartLayer(sd, true))
          );
        } else {
          layer.push(this.createChartLayer(sensorDesc, true));
        }
        appRef.aggregations[u.description] = this.calculateAggregates(
          u,
          observations,
          app
        );
      });

      chartData = {
        ...this.getCommonChartDefinitionPart(observations, app),
        layer,
      };
    }
    //Simple single unit
    else {
      const sensorDesc = this.getSensorDescriptor(unit, app);
      observations = this.getObservations(app);

      appRef.aggregations[unit.description] = this.calculateAggregates(
        unit,
        observations,
        app
      );
      observations.sort((a, b) => a.time_stamp - b.time_stamp);
      //Combine common and layer dependent chart definition
      chartData = {
        ...this.getCommonChartDefinitionPart(observations, app),
        ...this.createChartLayer(sensorDesc),
      };
    }

    try {
      vegaEmbed(
        appRef.dialogElement.nativeElement.querySelector('.hs-chartplace'),
        chartData
      );
    } catch (ex) {
      this.hsLogService.warn('Could not create vega chart:', ex);
    }
  }

  /**
   * Reset aggregations to default
   */
  resetAggregations(app: string) {
    this.get(app).aggregations = {};
  }

  /**
   * @param unit - Unit description
   * @param observations - Observations selected
   * @param app - App identifier
   * Calculate aggregates for selected unit
   */
  private calculateAggregates(
    unit: any,
    observations: any,
    app: string
  ): Aggregate[] {
    const aggregates: Aggregate[] = unit.sensors
      .filter((s) => this.get(app).sensorIdsSelected.indexOf(s.sensor_id) > -1)
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

  /**
   * SENSORS module translations helper
   */
  translate(text: string, group?: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(
      'SENSORS' + (group != undefined ? '.' + group : ''),
      text
    );
  }
}
