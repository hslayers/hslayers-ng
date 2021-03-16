import {Component, Input, OnChanges, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {Layer} from 'ol/layer';

import {Dimension, getDimensions} from '../../../common/layer-extensions';
import {HsDimensionDescriptor} from './dimension.class';
import {HsDimensionService} from '../../../common/dimension.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerEditorService} from '../layer-editor.service';
import {HsLayerManagerWmstService} from '../layermanager-wmst.service';
import {HsMapService} from '../../map/map.service';
import {HsUtilsService} from '../../utils/utils.service';

@Component({
  selector: 'hs-layer-editor-dimensions',
  templateUrl: './layer-editor-dimensions.html',
})
export class HsLayerEditorDimensionsComponent implements OnDestroy, OnChanges {
  @Input() layer: Layer;
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
        if (layer == this.layer) {
          this.ngOnChanges();
        }
      }
    );
  }
  ngOnDestroy(): void {
    this.layerDimensionDefinitionChangeSubscription.unsubscribe();
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

  dimensionIsTime(dimension: Dimension): boolean {
    const dimensions = getDimensions(this.layer);
    const type = Object.keys(dimensions).find(
      (key) => dimensions[key] === dimension
    );
    // value of time.onlyInEditor used inversely here intentionally
    // ( => replacement for inline time-editor)
    return type === 'time' && dimensions.time?.onlyInEditor;
  }
}
