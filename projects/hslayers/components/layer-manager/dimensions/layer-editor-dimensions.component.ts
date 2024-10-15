import {Component, OnInit} from '@angular/core';
import {filter, merge} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsDimensionDescriptor} from 'hslayers-ng/common/dimensions';
import {HsDimensionService} from 'hslayers-ng/services/get-capabilities';
import {HsDimensionTimeService} from 'hslayers-ng/services/get-capabilities';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerEditorWidgetBaseComponent} from '../widgets/layer-editor-widget-base.component';
import {HsLayerSelectorService} from 'hslayers-ng/services/layer-manager';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {getDimensions} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-layer-editor-dimensions',
  templateUrl: './layer-editor-dimensions.component.html',
})
export class HsLayerEditorDimensionsComponent
  extends HsLayerEditorWidgetBaseComponent
  implements OnInit
{
  name = 'dimensions';
  dimensions: Array<HsDimensionDescriptor> = [];

  constructor(
    public hsDimensionService: HsDimensionService,
    public hsDimensionTimeService: HsDimensionTimeService,
    public hsMapService: HsMapService,
    public hsEventBusService: HsEventBusService,
    public hsUtilsService: HsUtilsService,
    hsLayerSelectorService: HsLayerSelectorService,
  ) {
    super(hsLayerSelectorService);

    merge(
      this.hsEventBusService.layerDimensionDefinitionChanges.pipe(
        filter((layer) => layer === this.olLayer),
      ),
      this.layerDescriptor,
    )
      .pipe(
        filter((data) => !!data),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.updateDimensions();
      });
  }

  updateDimensions(): void {
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

  dimensionIsTime(dimension: HsDimensionDescriptor): boolean {
    const dimensions = getDimensions(this.olLayer);
    const type = Object.keys(dimensions).find(
      (key) => dimensions[key] === dimension,
    );
    // value of time.onlyInEditor used inversely here intentionally
    // ( => replacement for inline time-editor)
    return type === 'time' && dimensions.time?.onlyInEditor;
  }
}
