import moment from 'moment';
import momentinterval from 'moment-interval';
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

  prepareTimeSteps(step_string) {
    const step_array = step_string.split(',');
    const steps = [];
    for (let i = 0; i < step_array.length; i++) {
      if (step_array[i].indexOf('/') == -1) {
        steps.push(new Date(step_array[i]).toISOString());
        //console.log(new Date(step_array[i]).toISOString());
      } else {
        //"2016-03-16T12:00:00.000Z/2016-07-16T12:00:00.000Z/P30DT12H"
        const interval_def = step_array[i].split('/');
        let step;
        if (interval_def.length == 3) {
          step = momentinterval.interval(interval_def[2]);
        } else {
          step = momentinterval.interval('P1D');
        }
        const interval = momentinterval.interval(
          interval_def[0] + '/' + interval_def[1]
        );
        while (interval.start() < interval.end()) {
          //console.log(interval.start().toDate().toISOString());
          steps.push(interval.start().toDate().toISOString());
          interval.start(
            momentinterval.utc(interval.start().toDate()).add(step.period())
          );
        }
      }
    }
    return steps;
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
   * @param layer - Layer to fill the dimension values
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
   * @returns true if layer has any dimensions
   */
  isLayerWithDimensions(layer): boolean {
    if (layer === undefined) {
      return false;
    }

    const dimensions = getDimensions(layer);
    if (dimensions === undefined) {
      return false;
    }
    return Object.values(dimensions).length > 0;
  }
}
