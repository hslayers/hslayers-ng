import moment from 'moment';
import {Collection} from 'ol';
import {HsEventBusService} from '../core/event-bus.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {getDimensions} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerWmstService {
  constructor(
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService
  ) {}

  /**
   * Get date format of time data based on time unit property
   *
   * @function getDateFormatForTimeSlider
   * @memberOf HsLayermanagerWmstService
   * @param {string} time_unit
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
   *
   * @function setLayerTimeSliderIntervals
   * @memberOf HsLayermanagerWmstService
   * @param {object} new_layer Layer to set time intervals
   * @param {object} metadata Time dimension metadata for layer
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
   * @function parseInterval
   * @memberOf HsLayermanagerWmstService
   * @param {string} interval Interval time string
   * @description Parse interval string to get interval in Date format
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
   * @function layerIsWmsT
   * @memberOf HsLayermanagerWmstService
   * @param {Collection} layer_container Container object of layer (layer_container.layer expected)
   * @returns {boolean} True for WMS layer with time support
   * Test if WMS layer have time support (WMS-T). WMS layer has to have dimensions_time or dimension property, function converts dimension to dimensions_time
   */
  layerIsWmsT(layer_container: Collection): boolean {
    if (layer_container == undefined || layer_container === null) {
      return false;
    }
    const layer = layer_container.layer;
    if (layer == undefined) {
      return false;
    }
    if (
      layer.get('dimensions_time') &&
      Array.isArray(layer.get('dimensions_time').timeInterval)
    ) {
      return true;
    }
    const dimensions = getDimensions(layer);
    if (dimensions && dimensions['time']) {
      const metadata: any = {};
      let value;
      if (Array.isArray(dimensions['time'].values)) {
        value = dimensions['time'].values[0];
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
            metadata.timeStep = this.parseInterval(interval[2]);
            interval.pop();
          }
          if (interval.length == 2) {
            metadata.timeInterval = interval;
          }
        }
        Object.assign(layer, {
          dimensions_time: metadata,
        });
      }

      return Object.keys(metadata).length > 0;
    }
    return false;
  }

  /**
   * @function setLayerTime
   * @memberOf HsLayermanagerWmstService
   * @param {Layer} currentLayer Selected layer
   * @param {number} dateIncrement Value days, months or years by which to increment start time to reach current selected time in the range control
   * @description Update layer time parameter
   */
  setLayerTime(currentLayer: Layer, dateIncrement): void {
    if (currentLayer == undefined || currentLayer.layer == undefined) {
      return;
    }
    const dimensions_time =
      currentLayer.layer.get('dimensions_time') ||
      currentLayer.layer.dimensions_time;
    if (dimensions_time == undefined) {
      return;
    }
    let d: moment.Moment = moment.utc(dimensions_time.timeInterval[0]);
    switch (currentLayer.time_unit) {
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
    }

    currentLayer.time = d.toDate();
    currentLayer.layer.getSource().updateParams({
      'TIME': d.toISOString(),
    });
    this.HsEventBusService.layerTimeChanges.next({
      layer: currentLayer.layer,
      time: d.toISOString(),
    });
  }

  setupTimeLayerIfNeeded(new_layer: Layer): void {
    if (this.layerIsWmsT(new_layer)) {
      const dimensions_time =
        new_layer.layer.get('dimensions_time') ||
        new_layer.layer.dimensions_time;
      let time;
      const dimensions = getDimensions(new_layer.layer);
      if (dimensions['time'].default != undefined) {
        time = new Date(dimensions['time'].default);
      } else {
        time = new Date(dimensions_time.timeInterval[0]);
      }
      Object.assign(new_layer, {
        time_step: dimensions_time.timeStep,
        time_unit: dimensions_time.timeUnit,
        date_format: this.getDateFormatForTimeSlider(dimensions_time.timeUnit),
        date_from: new Date(dimensions_time.timeInterval[0]),
        date_till: new Date(dimensions_time.timeInterval[1]),
        time: time,
        date_increment: time.getTime(),
      });
      this.setLayerTimeSliderIntervals(new_layer, dimensions_time);
      this.setLayerTime(new_layer, 0);
    }
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
