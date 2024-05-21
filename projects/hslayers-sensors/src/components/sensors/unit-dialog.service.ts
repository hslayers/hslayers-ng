import {BehaviorSubject} from 'rxjs';
import {ElementRef, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import dayjs from 'dayjs';
import objectSupport from 'dayjs/plugin/objectSupport';
import {default as vegaEmbed} from 'vega-embed';

import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsUtilsService} from 'hslayers-ng/services/utils';

import {Aggregate} from './types/aggregate.type';
import {CustomInterval, Interval} from './types/interval.type';
import {HsSensorUnit} from './sensor-unit.class';
import {SensLogEndpoint} from './types/senslog-endpoint.type';
import {SenslogSensor} from './types/senslog-sensor.type';

dayjs.extend(objectSupport);

export class Aggregates {
  [key: string]: Aggregate[];
}

@Injectable({
  providedIn: 'root',
})
export class HsSensorsUnitDialogService {
  unit: HsSensorUnit[] = [];
  unitDialogVisible: boolean;
  sensorsSelected = new Map<string, any>();
  endpoint: SensLogEndpoint;
  observations: any;
  sensorById = {};
  dialogElement: ElementRef;
  aggregations: Aggregates = {};

  currentInterval: Interval;
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

  constructor(
    private http: HttpClient,
    private hsUtilsService: HsUtilsService,
    private hsLogService: HsLogService,
    private hsLanguageService: HsLanguageService,
  ) {
    this.currentInterval = this.intervals[2];
    this.useTimeZone.subscribe((value) => {
      this.timeFormat = value ? 'HH:mm:ssZ' : 'HH:mm:ss';
    });
  }

  /**
   * Select sensor from the list
   * @param sensor - Sensor selected
   */
  selectSensor(sensor: any) {
    this.sensorsSelected.forEach((s) => (s.checked = false));
    this.sensorsSelected = new Map([sensor.sensor_id, sensor]);
  }

  /**
   * Toggle selected sensor
   * @param sensor - Sensor selected
   */
  toggleSensor(sensor) {
    if (sensor.checked) {
      this.sensorsSelected.set(sensor.sensor_id, sensor);
    } else {
      this.sensorsSelected.delete(sensor.sensor_id);
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
    },
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
   * Filter out observations belonging to deselected sensor unit
   */
  filterObservations(unit): void {
    this.observations = this.observations.filter(
      (o) => o.unit_id !== unit.unit_id,
    );
  }

  /**
   * @param unit - Object containing
   * {description, is_mobile, sensors, unit_id, unit_type}
   * @param interval - Object {amount, unit}. Used to subtract time
   * from current time, like 6 months before now
   * Gets list of observations in a given time frame for all
   * the sensors on a sensor unit (meteostation).
   * @returns Promise which resolves when observation history data is received
   */
  getObservationHistory(
    unit: HsSensorUnit,
    interval: Interval | CustomInterval,
  ): Promise<boolean> {
    //TODO rewrite by splitting getting the observable and subscribing to results in different functions
    return new Promise((resolve, reject) => {
      const url = this.hsUtilsService.proxify(
        `${this.endpoint.url}/${this.endpoint.liteApiPath}/rest/observation`,
      );
      const time = this.getTimeForInterval(interval);
      const from_time = `${time.from_time.format(
        'YYYY-MM-DD',
      )} ${time.from_time.format(this.timeFormat)}`;
      const to_time = `${time.to_time.format(
        'YYYY-MM-DD',
      )} ${time.to_time.format(this.timeFormat)}`;
      interval.loading = true;
      this.http
        .get(
          `${url}?user_id=${encodeURIComponent(
            this.endpoint.user_id,
          )}&unit_id=${unit.unit_id}&from_time=${encodeURIComponent(
            from_time,
          )}&to_time=${encodeURIComponent(to_time)}`,
        )
        .subscribe({
          next: (response: Array<any>) => {
            interval.loading = false;
            if (this.comparisonAllowed && this.unit.length > 1) {
              this.observations = [
                ...this.observations,
                ...this.modifyObservationHistory(response),
              ];
            } else {
              this.observations = this.modifyObservationHistory(response);
            }
            resolve(true);
          },
          error: (err) => reject(err),
        });
    });
  }

  private getSensorDescriptor(
    unit: HsSensorUnit,
  ): SenslogSensor | SenslogSensor[] {
    const sensorDesc = unit.sensors.filter((s) =>
      this.sensorsSelected.has(s.sensor_id as string),
    );
    if (sensorDesc.length > 0 && !this.comparisonAllowed) {
      return sensorDesc[0] as SenslogSensor;
    }
    return sensorDesc;
  }

  private getObservations() {
    return this.observations.reduce((acc, val) => {
      return acc.concat(
        val.sensors
          .filter((s: SenslogSensor) =>
            this.sensorsSelected.has(s.sensor_id as string),
          )
          .map((s) => {
            const time = dayjs(val.time_stamp);
            s.sensor_name = `${this.sensorById[s.sensor_id].sensor_name}_${val.unit_id}`;
            s.time = time.format('DD.MM.YYYY HH:mm');
            s.unit_id = val.unit_id;
            s.time_stamp = time.toDate();
            return s;
          }),
      );
    }, []);
  }

  /**
   * Create vega chart definition layer
   * @param multi Multiple sensor units comparison flag
   */
  createChartLayer(sensorDesc, multi = false) {
    let title = this.translate('noSensorsSelected');
    if (Array.isArray(sensorDesc) && sensorDesc.length > 0) {
      if ([...new Set(sensorDesc.map((obj) => obj.sensor_type))].length == 1) {
        title = `${this.translate(
          sensorDesc[0].phenomenon_name,
          'PHENOMENON',
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
        'color': {
          'field': 'sensor_name',
          'legend': {
            'title': multi
              ? sensorDesc[0]?.unit_description
              : this.hsLanguageService.getTranslation('SENSORS.sensors'),
            'labelExpr': "split(datum.value, '_')[0]",
          },
          'type': 'nominal',
          'sort': 'sensor_id',
        },
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
        'tooltip': [
          {'field': 'value', 'title': 'Value'},
          {
            'field': 'time_stamp',
            'title': 'Timestamp',
            'timeUnit':
              this.currentInterval.unit === 'months'
                ? 'monthdate'
                : 'hoursminutes',
          },
        ],
      },
      'mark': {'type': 'line', 'tooltip': true},
    };
    if (multi) {
      layer['transform'] = [
        {
          'filter': sensorDesc
            .map(
              (sd) => `datum.sensor_name === '${sd.sensor_name}_${sd.unit_id}'`,
            )
            .join(' || '),
        },
      ];
      layer['encoding']['color']['legend']['values'] =
        this.getSensorLegendValues(sensorDesc);
    } else {
      layer.encoding = {
        ...layer.encoding,
        ...this.getCommonEncoding(),
      };
    }
    return layer;
  }

  /**
   * Get common part of the vega encoding
   */
  private getCommonEncoding() {
    return {
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

  private getSensorLegendValues(sensorDesc): string[] {
    return Array.isArray(sensorDesc)
      ? sensorDesc.map((sd) => `${sd.sensor_name}_${sd.unit_id}`)
      : [`${sensorDesc.sensor_name}_${sensorDesc.unit_id}'`];
  }

  getCommonChartDefinitionPart(observations) {
    //See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat for flattening array
    return {
      '$schema': 'https://vega.github.io/schema/vega-lite/v5.json',
      'config': {
        'mark': {
          'tooltip': null,
        },
      },
      'width': this.dialogElement.nativeElement.offsetWidth * 0.9,
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
      'encoding': this.getCommonEncoding(),
    } as any;
  }

  /**
   * @param unit - Unit description
   * @param app - App identifier
   * Create vega chart definition and use it in vegaEmbed
   * chart library. Observations for a specific unit from Senslog come
   * in a hierarchy, where 1st level contains object with timestamp and
   * for each timestamp there exist multiple sensor observations for
   * varying count of sensors. This nested list is flattened to simple
   * array of objects with {sensor_id, timestamp, value, sensor_name}
   */
  createChart(unit: HsSensorUnit | HsSensorUnit[]) {
    unit = Array.isArray(unit) ? (unit.length > 1 ? unit : unit[0]) : unit;

    let observations;
    let chartData = {};
    //Layered multi unit sensor view
    if (Array.isArray(unit)) {
      chartData['resolve'] = {'legend': {'color': 'independent'}};
      //Array holding every chart layer object
      const layer = [];
      observations = this.getObservations();

      unit.forEach((u) => {
        //Can only be an array (emtpy or not) but multiple units are passed only in case comparisonAllowed
        //thus -> SenslogSensor[]
        const sensorDesc = this.getSensorDescriptor(u) as SenslogSensor[];
        if (sensorDesc.length > 0) {
          layer.push(this.createChartLayer(sensorDesc, true));
        }
        this.aggregations[u.description] = this.calculateAggregates(
          u,
          observations,
        );
      });

      chartData = {
        ...chartData,
        ...this.getCommonChartDefinitionPart(observations),
        layer,
      };
    }
    //Simple single unit
    else {
      const sensorDesc = this.getSensorDescriptor(unit);
      observations = this.getObservations();
      this.aggregations[unit.description] = this.calculateAggregates(
        unit,
        observations,
      );
      observations.sort((a, b) => a.time_stamp - b.time_stamp);
      //Combine common and layer dependent chart definition
      chartData = {
        ...this.getCommonChartDefinitionPart(observations),
        ...this.createChartLayer(sensorDesc),
      };
    }

    try {
      vegaEmbed(
        this.dialogElement.nativeElement.querySelector('.hs-chartplace'),
        chartData,
      );
    } catch (ex) {
      this.hsLogService.warn('Could not create vega chart:', ex);
    }
  }

  /**
   * Reset aggregations to default
   */
  resetAggregations() {
    this.aggregations = {};
  }

  /**
   * @param unit - Unit description
   * @param observations - Observations selected
   * Calculate aggregates for selected unit
   */
  private calculateAggregates(
    unit: HsSensorUnit,
    observations: any,
  ): Aggregate[] {
    // Create a map of sensor IDs to their observations
    // Create a map of sensor IDs to their observations
    const observationMap = new Map<string, number[]>();
    observations.forEach((obs: {sensor_id: string; value: number}) => {
      if (!observationMap.has(obs.sensor_id)) {
        observationMap.set(obs.sensor_id, []);
      }
      observationMap.get(obs.sensor_id).push(obs.value);
    });

    const aggregates: Aggregate[] = unit.sensors
      .filter((s) => this.sensorsSelected.has(s.sensor_id as string))
      .map((sensor): Aggregate => {
        const observationsForSensor =
          observationMap.get(sensor.sensor_id as string) || [];
        const tmp: Aggregate = {
          min: 0,
          max: 0,
          avg: 0,
          sensor_id: sensor.sensor_id,
          sensor_name: sensor.sensor_name,
        };
        if (observationsForSensor.length === 0) {
          return tmp;
        }
        let sum = 0;

        observationsForSensor.forEach((value) => {
          if (value < tmp.min) {
            tmp.min = value;
          }
          if (value > tmp.max) {
            tmp.max = value;
          }
          sum += value;
        });

        tmp.avg = Math.round((sum / observationsForSensor.length) * 100) / 100;
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
      text,
    );
  }
}
