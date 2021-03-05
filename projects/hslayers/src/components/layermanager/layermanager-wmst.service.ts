import moment from 'moment';
import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';

import {HsDimensionDescriptor} from './dimensions/dimension.class';
import {HsDimensionService} from '../../common/dimension.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLogService} from '../../common/log/log.service';
import {HsUtilsService} from '../utils/utils.service';
import {WmsLayer} from '../../common/wms/wms-get-capabilities-response.interface';
import {getDimensions, setDimensions} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerWmstService {
  constructor(
    public HsEventBusService: HsEventBusService,
    public hsLog: HsLogService,
    public HsUtilsService: HsUtilsService,
    private hsDimensionService: HsDimensionService
  ) {}

  /**
   * Get date format of time data based on time unit property
   * @param time_unit
   */
  getDateFormatForTimeSlider(time_unit: string): string {
    switch (time_unit) {
      case 'FullYear':
      case 'Month':
      case 'Day':
        return 'dd-MM-yyyy';
      default:
        return 'dd-MM-yyyy HH:mm';
    }
  }

  /**
   * Set time intervals for WMS-T (WMS with time support)
   * @param {object} new_layer - Layer to set time intervals
   * @param {object} metadata - Time dimension metadata for layer
   */
  setLayerTimeSliderIntervals(new_layer, metadata): void {
    let d;
    switch (new_layer.time_unit) {
      case 'FullYear':
        d = new Date(metadata.timeInterval[0]);
        new_layer.min_time = d.getFullYear();
        d = new Date(metadata.timeInterval[1]);
        new_layer.max_time = d.getFullYear();
        break;
      case 'Month':
        d = new Date(metadata.timeInterval[0]);
        new_layer.min_time = 0;
        const d2 = new Date(metadata.timeInterval[1]);
        new_layer.max_time = d.monthDiff(d2);
        break;
      default:
        new_layer.min_time = moment
          .utc(metadata.timeInterval[0])
          .toDate()
          .getTime();
        new_layer.max_time = moment
          .utc(metadata.timeInterval[1])
          .toDate()
          .getTime();
    }
  }

  /**
   * Parse interval string to get interval in Date format
   * @param interval - Interval time string
   */
  parseInterval(interval: string): number {
    let dateComponent;
    let timeComponent;

    let year;
    let month;
    let day;
    let week;
    let hour;
    let minute;
    let second;

    year = month = week = day = hour = minute = second = 0;

    const indexOfT = interval.search('T');

    if (indexOfT > -1) {
      dateComponent = interval.substring(1, indexOfT);
      timeComponent = interval.substring(indexOfT + 1);
    } else {
      dateComponent = interval.substring(1);
    }

    // parse date
    if (dateComponent) {
      const indexOfY =
        dateComponent.search('Y') > -1 ? dateComponent.search('Y') : undefined;
      const indexOfM =
        dateComponent.search('M') > -1 ? dateComponent.search('M') : undefined;
      const indexOfW =
        dateComponent.search('W') > -1 ? dateComponent.search('W') : undefined;
      const indexOfD =
        dateComponent.search('D') > -1 ? dateComponent.search('D') : undefined;

      if (indexOfY !== undefined) {
        year = parseFloat(dateComponent.substring(0, indexOfY));
      }
      if (indexOfM !== undefined) {
        month = parseFloat(
          dateComponent.substring((indexOfY || -1) + 1, indexOfM)
        );
      }
      if (indexOfD !== undefined) {
        day = parseFloat(
          dateComponent.substring((indexOfM || indexOfY || -1) + 1, indexOfD)
        );
      }
    }

    // parse time
    if (timeComponent) {
      const indexOfH =
        timeComponent.search('H') > -1 ? timeComponent.search('H') : undefined;
      const indexOfm =
        timeComponent.search('M') > -1 ? timeComponent.search('M') : undefined;
      const indexOfS =
        timeComponent.search('S') > -1 ? timeComponent.search('S') : undefined;

      if (indexOfH !== undefined) {
        hour = parseFloat(timeComponent.substring(0, indexOfH));
      }
      if (indexOfm !== undefined) {
        minute = parseFloat(
          timeComponent.substring((indexOfH || -1) + 1, indexOfm)
        );
      }
      if (indexOfS !== undefined) {
        second = parseFloat(
          timeComponent.substring((indexOfm || indexOfH || -1) + 1, indexOfS)
        );
      }
    }
    // year, month, day, hours, minutes, seconds, milliseconds)
    const zero = new Date(0, 0, 0, 0, 0, 0, 0).getTime();
    const step = new Date(year, month, day, hour, minute, second, 0).getTime();
    return step - zero;
  }

  /**
   * Test if WMS layer has time support (WMS-T). WMS layer has to have dimension property
   * @param layer - Container object of layer (layerContainer.layer expected)
   * @returns True for WMS layer with time support
   */
  layerIsWmsT(layer: HsLayerDescriptor | Layer): boolean {
    if (layer?.layer) {
      // case of HsLayerDescriptor, Layer would have 'sublayers' property instead
      layer = layer.layer;
    }
    if (!layer) {
      return false;
    }
    /*
     * 'dimensions_time' is deprecated
     * backwards compatibility with HSL < 3.0
     */
    if (
      layer.get('dimensions_time') &&
      Array.isArray(layer.get('dimensions_time').timeInterval)
    ) {
      this.hsLog.warn(
        '"dimensions_time" is deprecated, use "dimensions" param with "time" object instead'
      );
      const currentDimensions = getDimensions(layer);
      const newTimeDimension = {
        label: 'time',
        default: layer.get('dimensions_time').value,
      };
      if (!currentDimensions) {
        setDimensions(layer, {'time': newTimeDimension});
      } else {
        setDimensions(
          layer,
          Object.assign(currentDimensions, {'time': newTimeDimension})
        );
      }
    }
    if (getDimensions(layer)?.time) {
      //this.parseDimensionParam(layer);
      return true;
    }
    return false;
  }

  //TODO: just copy-pasted from "layerIsWmsT()", needs clean-up FIXME: delete
  parseDimensionParam(layer: Layer): void {
    const dimensions = getDimensions(layer);
    if (dimensions && dimensions['time']) {
      const timedata: any = {};
      let value = dimensions['time'].values || dimensions['time'].value;
      if (Array.isArray(value)) {
        value = value[0];
      }
      if (
        typeof value === 'string' ||
        this.HsUtilsService.instOf(value, String)
      ) {
        value = value.replace(/\s*/g, '');

        if (value.search('/') > -1) {
          const interval = value.split('/').map((d) => {
            if (d.search('Z') > -1) {
              d = d.replace('Z', '00:00');
            }
            return d;
          });

          if (interval.length == 3) {
            timedata.timeStep = this.parseInterval(interval[2]);
            interval.pop();
          }
          if (interval.length == 2) {
            timedata.timeInterval = interval;
          }
        }
        layer.set('dimensions_time', timedata);
      }

      //return Object.keys(timedata).length > 0;
    }
  }

  /**
   * Make initial setup for WM(T)S-t layers
   * @param currentLayer - Layer for which the time is being set up
   * @param serviceLayer - Description of that layer's capabilities in a service
   */
  setupTimeLayer(
    currentLayer: HsLayerDescriptor,
    serviceLayer?: WmsLayer
  ): void {
    const olLayer = currentLayer.layer;
    //parse config set at a Layer level
    const hsLayerTimeConfig = getDimensions(olLayer)?.time;
    if (hsLayerTimeConfig?.onlyInEditor) {
      return;
    }
    //parse parametres available at the WM(T)S level
    let serviceLayerTimeConfig;
    if (serviceLayer) {
      if (!Array.isArray(serviceLayer.Dimension)) {
        serviceLayerTimeConfig = serviceLayer.Dimension;
      } else {
        serviceLayerTimeConfig = serviceLayer.Dimension?.find(
          (dim) => dim.name == 'time'
        ); // Let's assume there will be only one time dimension..
      }
    } else if (hsLayerTimeConfig) {
      serviceLayerTimeConfig = hsLayerTimeConfig;
    }

    const timePoints = Array.isArray(serviceLayerTimeConfig.values)
      ? serviceLayerTimeConfig.values
      : this.parseTimePoints(serviceLayerTimeConfig.values);
    // Gracefully fallback throught time settings to find the best default value
    let today = new Date().toISOString();
    today = today.slice(0, today.indexOf('T'));
    let defaultTime;
    if (timePoints.includes(hsLayerTimeConfig?.default)) {
      defaultTime = hsLayerTimeConfig.default;
    } else if (timePoints.includes(serviceLayerTimeConfig?.default)) {
      defaultTime = serviceLayerTimeConfig.default;
    } else if (timePoints.some((point) => point.startsWith(today))) {
      defaultTime = timePoints.find((point) => point.startsWith(today));
    } else {
      defaultTime = timePoints[0];
    }
    currentLayer.time = {
      default: defaultTime,
      timePoints,
      //time_step: hsLayerTimeConfig.timeStep, //TODO: cleanup this
      //time_unit: hsLayerTimeConfig.timeUnit, //TODO: cleanup this
      //date_format: this.getDateFormatForTimeSlider(hsLayerTimeConfig.timeUnit), //TODO: cleanup this
      //date_from: new Date(hsLayerTimeConfig.timeInterval[0]), //TODO: cleanup this
      //date_till: new Date(hsLayerTimeConfig.timeInterval[1]), //TODO: cleanup this
      //date_increment: time.getTime(), //TODO: cleanup this
    };
    //this.setLayerTimeSliderIntervals(layerDescriptor, hsLayerTimeConfig); //TODO: cleanup this
    this.setLayerTime(currentLayer, defaultTime);
  }

  private parseTimePoints(values: string): Array<string> {
    const timeValues = values.trim().split(',');
    if (timeValues.length == 3 && timeValues[2].startsWith('P')) {
      // Duration, pattern: "1999-01-22T19:00:00/2018-01-22T13:00:00/PT8766H"
      //TODO: not implemented
      throw new Error('Not implemented!');
      return;
    }
    return timeValues;
  }

  /**
   * Update layer TIME parameter
   * @param currentLayer - Selected layer
   * @param newTime - ISO8601 string of a date and time to set
   */
  setLayerTime(currentLayer: HsLayerDescriptor, newTime: string): void {
    if (currentLayer === undefined || currentLayer.layer === undefined) {
      return;
    }
    //const timeDef = getDimensions(currentLayer.layer).time;
    //if (timeDef === undefined /*|| timeDef.timeInterval === undefined*/) {
    //  return;
    //}
    /*let d: moment.Moment = moment.utc(timeDef.timeInterval[0]);
    switch ((currentLayer as any).time_unit) {
      case 'FullYear':
        d.set({year: dateIncrement});
        break;
      case 'Month':
        d.add(dateIncrement, 'months');
        break;
      default:
        if (dateIncrement < currentLayer.min_time) {
          dateIncrement = currentLayer.min_time;
        }
        if (dateIncrement > currentLayer.max_time) {
          dateIncrement = currentLayer.max_time;
        }
        d = moment.utc(parseInt(dateIncrement));
    }*/
    //currentLayer.time = d.toDate();
    const dimensions = getDimensions(currentLayer.layer);
    this.hsDimensionService.dimensionChanged(
      new HsDimensionDescriptor('time', dimensions['time'])
    );
    if (currentLayer.layer.getSource().updateParams) {
      currentLayer.layer.getSource().updateParams({
        'TIME': newTime, //d.toISOString(),
      });
    }
    this.HsEventBusService.layerTimeChanges.next({
      layer: currentLayer,
      time: newTime,
    });
    // For sync with hsCesium part
    // TODO: refactor HsDimensionDescriptor class to not use moment and so on,
    // then replace the null here with a meaningful value
    this.HsEventBusService.layermanagerDimensionChanges.next({
      layer: currentLayer.layer,
      dimension: null,
    });
  }
}

declare global {
  interface Date {
    monthDiff: (d2) => number;
  }
}
Date.prototype.monthDiff = function (d2) {
  let months: number;
  months = (d2.getFullYear() - this.getFullYear()) * 12;
  months -= this.getMonth() + 1;
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
};
