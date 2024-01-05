import {Component} from '@angular/core';
import {Observable, map} from 'rxjs';

import {HsLayerEditorWidgetBaseComponent} from '../layer-editor-widget-base.component';
import {HsLayerSelectorService} from 'hslayers-ng/shared/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {
  getWmsOriginalExtent,
  setWmsOriginalExtent,
} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-extent-widget',
  templateUrl: './extent-widget.component.html',
})
export class HsExtentWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  name = 'extent-widget';

  ignoreExtent: boolean;
  isEnabled: Observable<boolean>;
  constructor(
    hsLayerSelectorService: HsLayerSelectorService,
    private hsLayerUtilsService: HsLayerUtilsService,
  ) {
    super(hsLayerSelectorService);
    this.isEnabled = this.layerDescriptor.pipe(
      map((l) => {
        const originalExtent = getWmsOriginalExtent(l.layer);
        const isAllowed =
          originalExtent ?? this.hsLayerUtilsService.isLayerWMS(l.layer);
        if (isAllowed) {
          const extent = l.layer.getExtent();
          /**
           * Init with true only if no Extent + originalExtent (extent has been ignored by user before)
           */
          this.ignoreExtent = !extent && !!originalExtent;
          if (!originalExtent) {
            setWmsOriginalExtent(l.layer, extent);
          }
          /**
           * Show widget if extent or originalExtent is available
           */
          return !!originalExtent || !!extent;
        }
        return false;
      }),
    );
  }

  toggleIgnoreExtent(): void {
    this.ignoreExtent = !this.ignoreExtent;
    this.olLayer.setExtent(
      this.ignoreExtent ? undefined : getWmsOriginalExtent(this.olLayer),
    );
  }
}
