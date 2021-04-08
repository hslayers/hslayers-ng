import moment from 'moment';
import {ImageWMS, TileWMS, XYZ} from 'ol/source';
import {Injectable} from '@angular/core';

import {HsDimensionDescriptor} from '../components/layermanager/dimensions/dimension.class';
import {HsEventBusService} from '../components/core/event-bus.service';
import {HsLogService} from './log/log.service';
import {HsMapService} from '../components/map/map.service';
import {HsUtilsService} from '../components/utils/utils.service';
import {getDimensions} from './layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsDimensionService {
  constructor(
    public $log: HsLogService,
    private hsEventBusService: HsEventBusService,
    private hsUtilsService: HsUtilsService,
    private hsMapService: HsMapService
  ) {}

  prepareTimeSteps(step_string): string[] {
    const step_array = step_string.split(',');
    const steps = [];
    for (let i = 0; i < step_array.length; i++) {
      if (step_array[i].indexOf('/') == -1) {
        steps.push(new Date(step_array[i]).toISOString());
      } else {
        const interval_def = step_array[i].split('/');
        const step =
          interval_def.length == 3
            ? this.duration(interval_def[2])
            : this.duration('P1D');
        let iterator = new Date(interval_def[0]);
        const end = new Date(interval_def[1]);
        while (iterator <= end) {
          steps.push(iterator.toISOString());
          iterator = this.addStep(iterator, step);
        }
      }
    }
    return steps;
  }

  private addStep(
    iterator: Date,
    step: {
      weeks: number;
      years: number;
      months: number;
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
      milliseconds: number;
    }
  ) {
    iterator.setUTCFullYear(iterator.getUTCFullYear() + step.years);
    iterator.setUTCMonth(iterator.getUTCMonth() + step.months);
    iterator.setUTCDate(iterator.getUTCDate() + step.days);
    iterator.setUTCHours(iterator.getUTCHours() + step.hours);
    iterator.setUTCMinutes(iterator.getUTCMinutes() + step.minutes);
    iterator.setUTCSeconds(iterator.getUTCSeconds() + step.seconds);
    iterator.setUTCMilliseconds(
      iterator.getUTCMilliseconds() + step.milliseconds
    );
    return iterator;
  }

  duration(text: string) {
    //Idea taken from https://github.com/luisfarzati/moment-interval/blob/master/src/moment-interval.js duration function
    const iso8601 = /^P(?:(\d+(?:[\.,]\d{0,3})?W)|(\d+(?:[\.,]\d{0,3})?Y)?(\d+(?:[\.,]\d{0,3})?M)?(\d+(?:[\.,]\d{0,3})?D)?(?:T(\d+(?:[\.,]\d{0,3})?H)?(\d+(?:[\.,]\d{0,3})?M)?(\d+(?:[\.,]\d{0,3})?S)?)?)$/;
    const matches = text.match(iso8601);
    if (matches === null) {
      throw '"' + text + '" is an invalid ISO 8601 duration';
    }
    return {
      weeks: parseFloat(matches[1]) || 0,
      years: parseFloat(matches[2]) || 0,
      months: parseFloat(matches[3]) || 0,
      days: parseFloat(matches[4]) || 0,
      hours: parseFloat(matches[5]) || 0,
      minutes: parseFloat(matches[6]) || 0,
      seconds: parseFloat(matches[7]) || 0,
      milliseconds: parseFloat(matches[8]) || 0,
    };
  }

  getDimensionValues(dimension) {
    try {
      if (moment(dimension.default).isValid()) {
        return this.prepareTimeSteps(dimension.values);
      } else {
        return dimension.values.split(',');
      }
    } catch (ex) {
      this.$log.error(ex);
    }
  }

  hasNestedLayers(layer) {
    if (layer == undefined) {
      return false;
    }
    return layer.Layer !== undefined;
  }

  paramsFromDimensions(layer) {
    if (!layer.Dimension) {
      return;
    }
    const tmp = {};
    for (const dimension of layer.Dimension) {
      if (dimension.value) {
        tmp[dimension.name] = dimension.value;
      }
    }
    return tmp;
  }

  dimensionType(dimension) {
    if (dimension.type == undefined) {
      return null;
    }
    return dimension.type;
  }

  /**
   * A recursive function with goes through layers
   * children and sets the possible dimension values used in dropdown.
   *
   * @param layer Layer to fill the dimension values
   */
  fillDimensionValues(layer): void {
    for (const sublayer of layer.Layer) {
      if (this.hasNestedLayers(sublayer)) {
        this.fillDimensionValues(sublayer);
      }
      if (layer.Dimension) {
        for (const dimension of sublayer.Dimension) {
          dimension.values = this.getDimensionValues(dimension);
        }
      }
    }
  }

  dimensionChanged(dimension: HsDimensionDescriptor): void {
    dimension.postProcessDimensionValue();
    //Dimension can be linked to multiple layers
    for (const layer of this.hsMapService.map.getLayers().getArray()) {
      const iteratedDimensions = getDimensions(layer);
      if (
        iteratedDimensions &&
        Object.keys(iteratedDimensions).filter(
          (dimensionIterator) =>
            iteratedDimensions[dimensionIterator] == dimension.originalDimension
        ).length > 0 //Dimension also linked to this layer?
      ) {
        const src = layer.getSource();
        if (
          this.hsUtilsService.instOf(src, TileWMS) ||
          this.hsUtilsService.instOf(src, ImageWMS)
        ) {
          const params = src.getParams();
          params[dimension.name == 'time' ? 'TIME' : dimension.name] =
            dimension.value;
          src.updateParams(params);
        } else if (this.hsUtilsService.instOf(src, XYZ)) {
          src.refresh();
        }
        this.hsEventBusService.layermanagerDimensionChanges.next({
          layer: layer,
          dimension: dimension.originalDimension,
        });
      }
    }
  }

  /**
   * Test if layer has dimensions
   * @param layer
   * @return true if layer has any dimensions
   */
  isLayerWithDimensions(layer): boolean {
    if (layer === undefined) {
      return false;
    }

    const dimensions = getDimensions(layer);
    if (dimensions === undefined) {
      return false;
    }
    return (
      Object.keys(dimensions).filter((k) => {
        return k == 'time' ? dimensions[k].onlyInEditor : true;
      }).length > 0
    );
  }
}
