import {Component, Input} from '@angular/core';
import {HsDimensionDescriptor} from './dimension.class';
import {HsDimensionService} from '../../../common/dimension.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerEditorService} from '../layer-editor.service';
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
    public HsEventBusService: HsEventBusService,
    public HsLayerEditorService: HsLayerEditorService
  ) {
    this.HsLayerEditorService.layerDimensionDefinitionChange.subscribe(
      ({layer}) => {
        if (layer == this.olLayer) {
          this.ngOnChanges();
        }
      }
    );
  }

  ngOnChanges(): void {
    const layer = this.olLayer;
    this.dimensions = [];
    const dimensions = getDimensions(layer);
    if (dimensions && Object.entries(dimensions)) {
      for (const [key, dimension] of <[any, any]>Object.entries(dimensions)) {
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
    const dimensions = getDimensions(layer);
    if (dimensions == undefined) {
      return false;
    }
    return Object.keys(dimensions).length > 0;
  }

  dimensionChanged(dimension: HsDimensionDescriptor): void {
    dimension.postProcessDimensionValue();
    //Dimension can be linked to multiple layers
    for (const layer of this.HsMapService.map.getLayers().getArray()) {
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

function getDimensions(layer: any) {
  return layer.get('dimensions');
}
