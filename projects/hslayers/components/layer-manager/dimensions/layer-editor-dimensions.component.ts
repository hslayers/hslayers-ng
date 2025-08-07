import {Component, OnInit, inject} from '@angular/core';
import {filter, merge} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsDimensionDescriptor} from 'hslayers-ng/common/dimensions';
import {
  HsDimensionService,
  HsDimensionTimeService,
} from 'hslayers-ng/services/get-capabilities';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerEditorWidgetBaseComponent} from '../widgets/layer-editor-widget-base.component';
import {HsMapService} from 'hslayers-ng/services/map';
import {isFunction} from 'hslayers-ng/services/utils';
import {getDimensions} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-layer-editor-dimensions',
  templateUrl: './layer-editor-dimensions.component.html',
  standalone: false,
})
export class HsLayerEditorDimensionsComponent
  extends HsLayerEditorWidgetBaseComponent
  implements OnInit
{
  hsDimensionService = inject(HsDimensionService);
  hsDimensionTimeService = inject(HsDimensionTimeService);
  hsMapService = inject(HsMapService);
  hsEventBusService = inject(HsEventBusService);

  name = 'dimensions';
  dimensions: Array<HsDimensionDescriptor> = [];

  constructor() {
    super();
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
        if (isFunction(dimension.availability)) {
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
