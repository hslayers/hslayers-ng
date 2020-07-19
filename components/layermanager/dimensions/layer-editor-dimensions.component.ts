import BaseLayer from 'ol/layer/Base';
import {Component, Input} from '@angular/core';
import {HsDimensionDescriptor} from './dimension.class';
import {HsDimensionService} from '../../../common/dimension.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsMapService} from '../../map/map.service';
import {HsUtilsService} from '../../utils/utils.service';
import {ImageWMS, TileWMS, XYZ} from 'ol/source';
@Component({
  selector: 'hs-layer-editor-dimensions',
  template: require('./layer-editor-dimensions.html'),
})
export class HsLayerEditorDimensionsComponent {
  @Input('ol-layer') olLayer: BaseLayer;
  dimensions: Array<HsDimensionDescriptor> = [];

  constructor(
    private HsDimensionService: HsDimensionService,
    private HsUtilsService: HsUtilsService,
    private HsMapService: HsMapService,
    private HsEventBusService: HsEventBusService
  ) {}

  ngOnChanges(): void {
    const layer = this.olLayer;
    if (layer == undefined) {
      this.dimensions = [];
    }
    if (layer.get('dimensions') && Object.entries(layer.get('dimensions'))) {
      for (const [key, dimension] of Object.entries(layer.get('dimensions'))) {
        this.dimensions.push(new HsDimensionDescriptor(key, dimension));
      }
    }
  }

  /**
   * @function isLayerWithDimensions
   * @memberOf hs-layer-editor-dimensions
   * @description Test if layer has dimensions
   * @returns {boolean} Returns if layers has any dimensions
   */
  isLayerWithDimensions(): boolean {
    const layer = this.olLayer;
    if (layer == undefined) {
      return false;
    }
    if (layer.get('dimensions') == undefined) {
      return false;
    }
    return Object.keys(layer.get('dimensions')).length > 0;
  }

  dimensionChanged(dimension: HsDimensionDescriptor): void {
    dimension.postProcessDimensionValue();
    //Dimension can be linked to multiple layers
    for (const layer of this.HsMapService.map.getLayers().getArray()) {
      const iteratedDimensions = layer.get('dimensions');
      if (
        iteratedDimensions &&
        Object.keys(iteratedDimensions).filter(
          (dimensionIterator) =>
            iteratedDimensions[dimensionIterator] == dimension.originalDimension
        ).length > 0 //Dimension also linked to this layer?
      ) {
        const src = layer.getSource();
        if (
          this.HsUtilsService.instOf(src, TileWMS) ||
          this.HsUtilsService.instOf(src, ImageWMS)
        ) {
          const params = src.getParams();
          params[dimension.name] = dimension.value;
          src.updateParams(params);
        } else if (this.HsUtilsService.instOf(src, XYZ)) {
          src.refresh();
        }
        this.HsEventBusService.layermanagerDimensionChanges.next({
          layer: layer,
          dimension: dimension.originalDimension,
        });
      }
    }
  }
}
