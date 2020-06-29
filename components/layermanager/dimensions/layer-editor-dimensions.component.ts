import { ImageWMS, TileWMS, XYZ } from 'ol/source';
import { Component, Input } from '@angular/core';
import { HsMapService } from '../../map/map.service.js';
import { HsUtilsService } from '../../utils/utils.service';
import { HsDimensionService } from '../../../common/dimension.service.js';
@Component({
  selector: 'hs-layer-editor-dimensions',
  template: require('./layer-editor-dimensions.html')
})
export class HsLayerEditorDimensionsComponent {
  @Input('ol-layer') olLayer: any;

  constructor(
    private HsDimensionService: HsDimensionService,
    private HsUtilsService: HsUtilsService,
    private HsMapService: HsMapService
  ) { }

  dimensionType(dimension) {
    return this.HsDimensionService.dimensionType(dimension)
  }

  /**
   * @function isLayerWithDimensions
   * @memberOf hs.layer-editor-dimensions
   * @description Test if layer has dimensions
   * @returns {boolean} Returns if layers has any dimensions
   */
  isLayerWithDimensions() {
    const layer = this.olLayer;
    if (layer == undefined) {
      return false;
    }
    if (layer.get('dimensions') == undefined) {
      return false;
    }
    return Object.keys(layer.get('dimensions')).length > 0;
  }

  dimensionChanged(dimension) {
    //Dimension can be linked to multiple layers
    this.HsMapService.map.getLayers().forEach((layer) => {
      const iteratedDimensions = layer.get('dimensions');
      if (
        iteratedDimensions &&
        Object.keys(iteratedDimensions).filter(
          (dimensionIterator) =>
            iteratedDimensions[dimensionIterator] == dimension
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
        $scope.$emit('layermanager.dimension_changed', {
          layer: layer,
          dimension,
        });
      }
    });
  }

  dimensions() {
    const layer = this.olLayer;
    if (layer == undefined) {
      return [];
    }
    return layer.get('dimensions');
  }
};
