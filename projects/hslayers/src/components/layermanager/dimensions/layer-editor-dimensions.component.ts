import {Component, Input} from '@angular/core';
import {HsDimensionDescriptor} from './dimension.class';
import {HsDimensionService} from '../../../common/dimension.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsMapService} from '../../map/map.service';
import {HsUtilsService} from '../../utils/utils.service';
import {ImageWMS, TileWMS, XYZ} from 'ol/source';
import {Layer} from 'ol/layer';
@Component({
  selector: 'hs-layer-editor-dimensions',
  templateUrl: './layer-editor-dimensions.html',
})
export class HsLayerEditorDimensionsComponent {
  @Input('ol-layer') olLayer: Layer;
  dimensions: Array<HsDimensionDescriptor> = [];

  constructor(
    public HsDimensionService: HsDimensionService,
    public HsUtilsService: HsUtilsService,
    public HsMapService: HsMapService,
    public HsEventBusService: HsEventBusService
  ) {}

  ngOnChanges(): void {
    const layer = this.olLayer;
    if (layer == undefined) {
      this.dimensions = [];
    }
    if (layer.get('dimensions') && Object.entries(layer.get('dimensions'))) {
      for (const [key, dimension] of <[any, any]>(
        Object.entries(layer.get('dimensions'))
      )) {
        let available = true;
        if (this.HsUtilsService.isFunction(dimension.availability)) {
          available = dimension.availability(layer);
        }
        if (available) {
          this.dimensions.push(new HsDimensionDescriptor(key, dimension));
        }
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
