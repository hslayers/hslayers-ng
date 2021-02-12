import moment from 'moment';
import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {WMSCapabilities, WMTSCapabilities} from 'ol/format';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsUtilsService} from '../utils/utils.service';
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
   * @param layerDescriptor - Container object of layer (layerContainer.layer expected)
   * @returns True for WMS layer with time support
   */
  layerIsWmsT(layerDescriptor: HsLayerDescriptor): boolean {
    if (!layerDescriptor) {
      return false;
    }
    const layer = layerDescriptor.layer;
    if (!layer) {
      return false;
    }
    if (
      //TODO: 'dimensions_time' is deprecated
      (layer.get('dimensions_time') &&
        Array.isArray(layer.get('dimensions_time').timeInterval)) ||
      (layer.get('dimensions')?.time &&
        typeof layer.get('dimensions')?.time === 'object')
    ) {
      this.parseDimensionParam(layer);
      return true;
    }
    return false;
  }

  //TODO: just copy-pasted from "layerIsWmsT()", needs clean-up
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

  setupTimeLayer(layerDescriptor: HsLayerDescriptor): void {
    console.log('setupTimeLayer@wmst', layerDescriptor);
    const hsLayerTimeConfig =
      layerDescriptor.layer.get('dimensions').time ??
      layerDescriptor.layer.get('dimensions_time') ?? //backwards compatibility
      layerDescriptor.layer.dimensions_time; //backwards compatibility
    const serviceLayerTimeConfig = layerDescriptor.layer
      .get('Dimension')
      ?.filter((dim) => dim.name == 'time')[0]; // Let's assume there will be only one time dimension..
    console.log(serviceLayerTimeConfig);
    layerDescriptor.time = {
      default:
        hsLayerTimeConfig.default ??
        serviceLayerTimeConfig.default ??
        (hsLayerTimeConfig.timeInterval
          ? hsLayerTimeConfig.timeInterval[0]
          : null),
      timePoints: this.parseTimePoints(serviceLayerTimeConfig.values),
      time_step: hsLayerTimeConfig.timeStep, //TODO: cleanup this
      time_unit: hsLayerTimeConfig.timeUnit, //TODO: cleanup this
      date_format: this.getDateFormatForTimeSlider(hsLayerTimeConfig.timeUnit), //TODO: cleanup this
      //date_from: new Date(hsLayerTimeConfig.timeInterval[0]), //TODO: cleanup this
      //date_till: new Date(hsLayerTimeConfig.timeInterval[1]), //TODO: cleanup this
      //date_increment: time.getTime(), //TODO: cleanup this
    };
    console.log('after fill', layerDescriptor);
    //this.setLayerTimeSliderIntervals(layerDescriptor, hsLayerTimeConfig); //TODO: cleanup this
    this.setLayerTime(layerDescriptor, '0'); //TODO: cleanup this
  }

  private parseTimePoints(values: string): Array<string> {
    return values.trim().split(',');
  }

  /**
   * Update layer TIME parameter
   * @param currentLayer - Selected layer
   * @param newTime - ISO string of a date and time to set
   */
  setLayerTime(currentLayer: HsLayerDescriptor, newTime: string): void {
    if (currentLayer === undefined || currentLayer.layer === undefined) {
      return;
    }
    const timeDef = currentLayer.layer.get('dimensions').time;
    if (timeDef === undefined /*|| timeDef.timeInterval === undefined*/) {
      return;
    }
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
    console.log('wmst-service, setting time to ', newTime);
    currentLayer.layer.getSource().updateParams({
      'TIME': newTime, //d.toISOString(),
    });
    this.HsEventBusService.layerTimeChanges.next({
      layer: currentLayer,
      time: newTime,
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
