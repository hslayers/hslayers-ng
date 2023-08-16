import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import {ImageWMS, Source, TileWMS} from 'ol/source';
import {Layer} from 'ol/layer';

import {HsLayerDescriptor} from '../../components/layermanager/layer-descriptor.interface';
import {HsLogService} from '../log/log.service';
import {HsUtilsService} from '../../components/utils/utils.service';
import {HsWmsLayer} from './wms-get-capabilities-response.interface';
import {getDimensions, setDimension, setDimensions} from '../layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsDimensionTimeService {
  /**
   * To communicate changes between this service and HsDimensionService
   */
  layerTimeChanges: Subject<{
    layer: HsLayerDescriptor;
    time: string;
  }> = new Subject();

  constructor(
    public hsLog: HsLogService,
    public HsUtilsService: HsUtilsService
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
  layerIsWmsT(layer: HsLayerDescriptor | Layer<Source>): boolean {
    const olLayer: Layer<Source> =
      (layer as HsLayerDescriptor).layer ?? (layer as Layer<Source>);
    if (!olLayer) {
      return false;
    }
    if ((layer as HsLayerDescriptor).time) {
      return true;
    }
    /*
     * 'dimensions_time' is deprecated
     * backwards compatibility with HSL < 3.0
     */
    if (
      olLayer.get('dimensions_time') &&
      Array.isArray(olLayer.get('dimensions_time').timeInterval)
    ) {
      this.hsLog.warn(
        '"dimensions_time" is deprecated, use "dimensions" param with "time" object instead'
      );
      const currentDimensions = getDimensions(olLayer);
      const newTimeDimension = {
        label: 'time',
        default: olLayer.get('dimensions_time').value,
      };
      if (!currentDimensions) {
        setDimensions(olLayer, {'time': newTimeDimension});
      } else {
        setDimensions(
          olLayer,
          Object.assign(currentDimensions, {'time': newTimeDimension})
        );
      }
    }
    if (getDimensions(olLayer)?.time) {
      return true;
    }
    return false;
  }

  /**
   * Make initial setup for WM(T)S-t layers
   * @param currentLayer - Layer for which the time is being set up
   * @param serviceLayer - Description of that layer's capabilities in a service
   */
  setupTimeLayer(
    currentLayer: HsLayerDescriptor,

    serviceLayer?: HsWmsLayer
  ): void {
    const olLayer = currentLayer.layer;
    //parse config set at a Layer level
    const hsLayerTimeConfig = getDimensions(olLayer)?.time;
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
    // Gracefully fallback through time settings to find the best default value
    let today = new Date().toISOString();
    today = today.slice(0, today.indexOf('T'));
    let defaultTime;
    let layerParams = {};
    const isTileWms = this.HsUtilsService.instOf(olLayer.getSource(), TileWMS);
    if (isTileWms) {
      const src = olLayer.getSource() as TileWMS;
      layerParams = src.getParams();
      src.on('change', (_) => {
        this.syncQueryParamToDimension(src, olLayer, currentLayer);
      });
    }
    const isImgWms = this.HsUtilsService.instOf(olLayer.getSource(), ImageWMS);
    if (isImgWms) {
      const src = olLayer.getSource() as ImageWMS;
      layerParams = src.getParams();
      src.on('change', (_) => {
        this.syncQueryParamToDimension(src, olLayer, currentLayer);
      });
    }
    if (layerParams['TIME'] && timePoints.includes(layerParams['TIME'])) {
      defaultTime = layerParams['TIME'];
    } else if (timePoints.includes(hsLayerTimeConfig?.default)) {
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
    };
    this.polyfillLayerDimensionsValues(currentLayer);
    this.setLayerTime(currentLayer, defaultTime);
  }

  /**
   * When PARAMS object on layer source is set directly from outside
   * we want to monitor it and set time dimension separately to
   * update the time selector. The actual dimension value will be
   * set in postProcessDimensionValue function of
   * get-capabilities/dimension class.
   */
  private syncQueryParamToDimension(
    src: TileWMS | ImageWMS,
    olLayer,
    currentLayer: HsLayerDescriptor
  ) {
    const timeFromParams = src.getParams()['TIME'];
    if (
      timeFromParams &&
      timeFromParams != getDimensions(olLayer)?.time.value
    ) {
      this.setLayerTime(currentLayer, timeFromParams);
    }
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
    this.layerTimeChanges.next({
      layer: currentLayer,
      time: newTime,
    });
  }

  /**
   * Reads a time dimension definition and transforms it into a canonical form of an array of time points
   * @param values - Stringified time definition. Either defined by a list of values or by an ISO 8601 duration pattern
   * @returns Array of time points in ISO 8601 format
   */
  parseTimePoints(values: string): Array<string> {
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
        // Daily interval is a pure guessing here and might be overkill for common cases
        // TODO: => try better guessing
        return this.timePointsFromInterval(
          timeValues[0],
          timeValues[1],
          24 * 60 * 60 * 1000
        );
      } else {
        throw new Error(`Invalid ISO8601 time definition provided: ${values}`);
      }
    }
    return values.split(',');
  }

  /**
   * Because of the way the HsDimension interface is set up,
   * we need to fill all parsed and currently undefined values
   * into the "dimensions" property of OL Layer as well.
   * Nevertheless we are duplicating some information.
   */
  private polyfillLayerDimensionsValues(
    layerDescriptor: HsLayerDescriptor
  ): void {
    if (!getDimensions(layerDescriptor.layer)?.time) {
      setDimension(layerDescriptor.layer, {label: 'time'}, 'time');
    }
    const dimensionTimeProp = getDimensions(layerDescriptor.layer).time;
    dimensionTimeProp.label = dimensionTimeProp.label ?? 'time';
    dimensionTimeProp.default =
      dimensionTimeProp.default ?? layerDescriptor.time.default;
    dimensionTimeProp.value =
      dimensionTimeProp.value ?? layerDescriptor.time.default;
    dimensionTimeProp.values =
      dimensionTimeProp.values ?? layerDescriptor.time.timePoints;
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
