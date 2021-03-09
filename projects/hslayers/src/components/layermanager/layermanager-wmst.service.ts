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
   * Parse interval string to get interval as a number
   * @param interval - Interval time string
   * @returns - Number of milliseconds representing the interval
   */
  parseInterval(interval: string): number {
    let dateComponent;
    let timeComponent;

    let year;
    let month;
    let day;
    let hour;
    let minute;
    let second;

    // eslint-disable-next-line no-multi-assign
    year = month = day = hour = minute = second = 0;

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
      }
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
      //time_unit: hsLayerTimeConfig.timeUnit, //TODO: cleanup this
    };
    this.setLayerTime(currentLayer, defaultTime);
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
    const dimensions = getDimensions(currentLayer.layer);
    const dimensionDesc = new HsDimensionDescriptor(
      'time',
      dimensions['time'] || dimensions['TIME']
    );
    dimensionDesc.modelValue = newTime;
    this.hsDimensionService.dimensionChanged(dimensionDesc);
    this.HsEventBusService.layerTimeChanges.next({
      layer: currentLayer,
      time: newTime,
    });
  }

  private parseTimePoints(values: string): Array<string> {
    values = values.trim();
    if (values.includes('/')) {
      const timeValues = values.split('/');
      if (timeValues.length == 3 && timeValues[2].trim().startsWith('P')) {
        // Duration, pattern: "1999-01-22T19:00:00/2018-01-22T13:00:00/PT8766H"
        return this.timePointsFromInterval(
          timeValues[0],
          timeValues[1],
          this.parseInterval(timeValues[2])
        );
      } else if (timeValues.length == 2) {
        // Duration, pattern: "1999-01-22T19:00:00/2018-01-22T13:00:00"
        // TODO: hourly interval is a pure guessing here and will be most like overkill for usual cases
        // TODO: => try better guessing
        return this.timePointsFromInterval(
          timeValues[0],
          timeValues[1],
          3600000
        );
      } else {
        throw new Error(`Invalid time definition provided: ${values}`);
      }
    }
    return values.split(',');
  }

  private timePointsFromInterval(
    start: string,
    end: string,
    step: number
  ): Array<string> {
    const timePoints = [];
    const endMillis = new Date(end).getTime();
    let tempMillis = new Date(start).getTime();
    while (tempMillis <= endMillis) {
      timePoints.push(new Date(tempMillis).toISOString());
      tempMillis += step;
    }
    return timePoints;
  }
}
