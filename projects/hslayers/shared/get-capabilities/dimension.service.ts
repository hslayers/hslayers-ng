import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {Source, Vector as VectorSource, XYZ} from 'ol/source';

import {HsDimensionDescriptor} from 'hslayers-ng/common/dimensions';
import {HsDimensionTimeService} from './dimension-time.service';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {
  HsWmsLayer,
  WmsDimension,
} from './wms-get-capabilities-response.interface';
import {getDimensions} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsDimensionService {
  constructor(
    public $log: HsLogService,
    public hsDimensionTimeService: HsDimensionTimeService,
    public hsEventBusService: HsEventBusService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
  ) {
    this.hsDimensionTimeService.layerTimeChanges.subscribe(
      ({layer: layerDescriptor, time: newTime}) => {
        const dimensions = getDimensions(layerDescriptor.layer);
        if (dimensions && (dimensions['time'] || dimensions['TIME'])) {
          const dimensionDesc = new HsDimensionDescriptor(
            'time',
            dimensions['time'] ?? dimensions['TIME'],
          );
          dimensionDesc.modelValue = newTime;
          this.dimensionChanged(dimensionDesc);
        }
      },
    );
  }

  getDimensionValues(dimension: WmsDimension): Array<string> {
    try {
      if (typeof dimension.values === 'string') {
        return this.hsDimensionTimeService.parseTimePoints(dimension.values);
      } else {
        return dimension.values;
      }
    } catch (ex) {
      this.$log.error(ex);
    }
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

  /**
   * A recursive function with goes through layers
   * children and sets the possible dimension values used in dropdown.
   *
   * @param layer - Layer to fill the dimension values
   */
  fillDimensionValues(layer: HsWmsLayer): void {
    if (!Array.isArray(layer.Layer)) {
      return;
    }
    if (
      this.hsLayerUtilsService.hasNestedLayers(layer) &&
      Array.isArray(layer.Layer)
    ) {
      for (const sublayer of layer.Layer) {
        this.fillDimensionValues(sublayer);
      }
    }
    if (layer.Dimension && Array.isArray(layer.Dimension)) {
      for (const dimension of layer.Dimension) {
        /* Since we augment the 'values' property here in the WmsLayer definition
         * it shall not be needed again in the HsDimensionTimeService.setupTimeLayer()
         */
        dimension.values = this.getDimensionValues(dimension);
      }
    }
  }

  dimensionChanged(dimension: HsDimensionDescriptor): void {
    dimension.postProcessDimensionValue();
    //Dimension can be linked to multiple layers
    for (const layer of this.hsMapService.getLayersArray()) {
      const iteratedDimensions = getDimensions(layer);
      if (
        iteratedDimensions &&
        Object.keys(iteratedDimensions).filter(
          (dimensionIterator) =>
            iteratedDimensions[dimensionIterator] ==
            dimension.originalDimension,
        ).length > 0 //Dimension also linked to this layer?
      ) {
        const src = layer.getSource();
        if (this.hsLayerUtilsService.isLayerWMS(layer)) {
          const params = this.hsLayerUtilsService.getLayerParams(layer);
          params[dimension.name == 'time' ? 'TIME' : dimension.name] =
            dimension.value;
          this.hsLayerUtilsService.updateLayerParams(layer, params);
        } else if (this.hsUtilsService.instOf(src, XYZ)) {
          src.refresh();
        } else if (this.hsUtilsService.instOf(src, VectorSource)) {
          (src as VectorSource).refresh();
        }
        this.hsEventBusService.layermanagerDimensionChanges.next({
          layer,
          dimension: dimension.originalDimension,
        });
      }
    }
  }

  /**
   * Test if layer has dimensions
   * @param layer - OL Layer
   * @returns true if layer has any dimensions
   */
  isLayerWithDimensions(layer: Layer<Source>): boolean {
    if (!layer) {
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
