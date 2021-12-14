import {Component, Input, OnChanges, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

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
  templateUrl: './layer-editor-dimensions.html',
})
export class HsLayerEditorDimensionsComponent
  extends HsLayerEditorWidgetBaseComponent
  implements OnDestroy, OnChanges
{
  name: 'dimensions';
  dimensions: Array<HsDimensionDescriptor> = [];
  private ngUnsubscribe = new Subject<void>();

  constructor(
    public hsDimensionService: HsDimensionService,
    public hsDimensionTimeService: HsDimensionTimeService,
    public hsMapService: HsMapService,
    public hsEventBusService: HsEventBusService,
    public hsUtilsService: HsUtilsService,
    private hsLayerSelectorService: HsLayerSelectorService
  ) {
    super(hsLayerSelectorService);
    this.hsEventBusService.layerDimensionDefinitionChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({layer}) => {
        if (layer == this.olLayer()) {
          this.ngOnChanges();
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnChanges(): void {
    const layer = this.olLayer();
    this.dimensions = [];
    const dimensions = getDimensions(this.olLayer());
    if (dimensions && Object.entries(dimensions)) {
      for (const [key, dimension] of <[any, any]>Object.entries(dimensions)) {
        let available = true;
        if (this.hsUtilsService.isFunction(dimension.availability)) {
          available = dimension.availability(this.olLayer());
        }
        if (available) {
          if (typeof dimension.values === 'string') {
            dimension.values = this.hsDimensionTimeService.parseTimePoints(
              dimension.values
            );
          }
          this.dimensions.push(new HsDimensionDescriptor(key, dimension));
        }
      }
    }
  }

  dimensionIsTime(dimension: Dimension): boolean {
    const dimensions = getDimensions(this.olLayer());
    const type = Object.keys(dimensions).find(
      (key) => dimensions[key] === dimension
    );
    // value of time.onlyInEditor used inversely here intentionally
    // ( => replacement for inline time-editor)
    return type === 'time' && dimensions.time?.onlyInEditor;
  }
}
