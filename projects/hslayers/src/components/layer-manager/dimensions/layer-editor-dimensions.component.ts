import {Component, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {Dimension, getDimensions} from '../../../common/layer-extensions';
import {HsDimensionDescriptor} from '../../../common/get-capabilities/dimension';
import {HsDimensionService} from '../../../common/get-capabilities/dimension.service';
import {HsDimensionTimeService} from '../../../common/get-capabilities/dimension-time.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerEditorWidgetBaseComponent} from '../widgets/layer-editor-widget-base.component';
import {HsLayerSelectorService} from '../editor/layer-selector.service';
import {HsMapService} from '../../map/map.service';
import {HsUtilsService} from '../../utils/utils.service';

@Component({
  selector: 'hs-layer-editor-dimensions',
  templateUrl: './layer-editor-dimensions.component.html',
})
export class HsLayerEditorDimensionsComponent
  extends HsLayerEditorWidgetBaseComponent
  implements OnDestroy, OnChanges, OnInit
{
  name = 'dimensions';
  dimensions: Array<HsDimensionDescriptor> = [];
  private end = new Subject<void>();

  constructor(
    public hsDimensionService: HsDimensionService,
    public hsDimensionTimeService: HsDimensionTimeService,
    public hsMapService: HsMapService,
    public hsEventBusService: HsEventBusService,
    public hsUtilsService: HsUtilsService,
    hsLayerSelectorService: HsLayerSelectorService,
  ) {
    super(hsLayerSelectorService);
    this.hsEventBusService.layerDimensionDefinitionChanges
      .pipe(takeUntil(this.end))
      .subscribe((layer) => {
        if (layer == this.olLayer) {
          this.ngOnChanges();
        }
      });
    this.layerDescriptor.pipe(takeUntil(this.end)).subscribe((descriptor) => {
      this.ngOnChanges();
    });
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnChanges(): void {
    const layer = this.olLayer;
    if (!layer) {
      return;
    }
    this.dimensions = [];
    const dimensions = getDimensions(layer);
    if (dimensions && Object.entries(dimensions)) {
      for (const [key, dimension] of <[any, any]>Object.entries(dimensions)) {
        let available = true;
        if (this.hsUtilsService.isFunction(dimension.availability)) {
          available = dimension.availability(layer);
        }
        if (available) {
          if (typeof dimension.values === 'string') {
            dimension.values = this.hsDimensionTimeService.parseTimePoints(
              dimension.values,
            );
          }
          this.dimensions.push(new HsDimensionDescriptor(key, dimension));
        }
      }
    }
  }

  dimensionIsTime(dimension: Dimension): boolean {
    const dimensions = getDimensions(this.olLayer);
    const type = Object.keys(dimensions).find(
      (key) => dimensions[key] === dimension,
    );
    // value of time.onlyInEditor used inversely here intentionally
    // ( => replacement for inline time-editor)
    return type === 'time' && dimensions.time?.onlyInEditor;
  }
}
