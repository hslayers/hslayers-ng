import {Component, Input, OnChanges, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {ImageWMS, TileWMS, XYZ} from 'ol/source';
import {Layer} from 'ol/layer';

import {HsDimensionDescriptor} from './dimension.class';
import {HsDimensionService} from '../../../common/dimension.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerEditorService} from '../layer-editor.service';
import {HsLayerManagerWmstService} from '../layermanager-wmst.service';
import {HsMapService} from '../../map/map.service';
import {HsUtilsService} from '../../utils/utils.service';
import {getDimensions} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-layer-editor-dimensions',
  templateUrl: './layer-editor-dimensions.html',
})
export class HsLayerEditorDimensionsComponent implements OnChanges, OnDestroy {
  @Input() olLayer: Layer;
  dimensions: Array<HsDimensionDescriptor> = [];
  layerDimensionDefinitionChangeSubscription: Subscription;
  constructor(
    public hsDimensionService: HsDimensionService,
    public hsUtilsService: HsUtilsService,
    public hsMapService: HsMapService,
    public hsEventBusService: HsEventBusService,
    public hsLayerEditorService: HsLayerEditorService,
    public hsLayerManagerWmstService: HsLayerManagerWmstService
  ) {
    this.layerDimensionDefinitionChangeSubscription = this.hsLayerEditorService.layerDimensionDefinitionChange.subscribe(
      ({layer}) => {
        if (layer == this.olLayer) {
          this.ngOnChanges();
        }
      }
    );
  }
  ngOnDestroy(): void {
    this.layerDimensionDefinitionChangeSubscription.unsubscribe();
  }

  ngOnChanges(): void {
    const layer = this.olLayer;
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
   * @return Returns if layers has any dimensions
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
}
