import {Component, Input} from '@angular/core';

import {ImageWMS, TileWMS, XYZ} from 'ol/source';
import {Layer} from 'ol/layer';

import {Dimension, getDimensions} from '../../../common/layer-extensions';
import {HsDimensionDescriptor} from './dimension.class';
import {HsDimensionService} from '../../../common/dimension.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerEditorService} from '../layer-editor.service';
import {HsLayerManagerWmstService} from '../layermanager-wmst.service';
import {HsMapService} from '../../map/map.service';
import {HsUtilsService} from '../../utils/utils.service';

import moment from 'moment';
@Component({
  selector: 'hs-layer-editor-dimensions',
  templateUrl: './layer-editor-dimensions.html',
})
export class HsLayerEditorDimensionsComponent {
  @Input() layer: Layer;
  dimensions: Array<HsDimensionDescriptor> = [];

  constructor(
    public hsDimensionService: HsDimensionService,
    public hsUtilsService: HsUtilsService,
    public hsMapService: HsMapService,
    public hsEventBusService: HsEventBusService,
    public hsLayerEditorService: HsLayerEditorService,
    public hsLayerManagerWmstService: HsLayerManagerWmstService
  ) {
    this.hsLayerEditorService.layerDimensionDefinitionChange.subscribe(
      ({layer}) => {
        if (layer == this.layer) {
          this.ngOnChanges();
        }
      }
    );
  }

  ngOnChanges(): void {
    const layer = this.layer;
    this.dimensions = [];
    const dimensions = getDimensions(layer);
    if (dimensions && Object.entries(dimensions)) {
      for (const [key, dimension] of <[any, any]>Object.entries(dimensions)) {
        let available = true;
        if (this.hsUtilsService.isFunction(dimension.availability)) {
          available = dimension.availability(layer);
        }
        if (available) {
          this.dimensions.push(new HsDimensionDescriptor(key, dimension));
        }
      }
    }
  }

  /**
   * Test if layer has dimensions
   * @returns true if layer has any dimensions
   */
  isLayerWithDimensions(): boolean {
    if (this.layer === undefined) {
      return false;
    }
    const dimensions = getDimensions(this.layer);
    if (dimensions === undefined) {
      return false;
    }
    return (
      Object.values(dimensions).filter((dim) => {
        return dim.onlyInEditor;
      }).length > 0
    );
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
          params[dimension.name] = dimension.value;
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

  dimensionIsTime(dimension: Dimension): boolean {
    const dimensions = getDimensions(this.layer);
    const type = Object.keys(dimensions).find(
      (key) => dimensions[key] === dimension
    );
    // value of time.onlyInEditor used inversely here intentionally
    // ( => replacement for inline time-editor)
    return type === 'time' && dimensions.time?.onlyInEditor;
  }

  //TODO: remove with moment elimination
  /**
   * @function dateToNonUtc
   * @memberOf HsLayerEditorComponent
   * @param {Date} d Date to convert
   * @description Convert date to non Utc format
   * @returns {Date} Date with timezone added
   */
  dateToNonUtc(d: Date): Date | undefined {
    if (d == undefined) {
      return;
    }
    const noutc = new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
    return noutc;
  }

  //TODO: remove with moment elimination
  formatDate(date, format) {
    return moment(date).format(format);
  }
}
