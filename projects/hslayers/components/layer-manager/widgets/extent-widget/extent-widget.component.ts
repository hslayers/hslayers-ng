import {Component} from '@angular/core';
import {Observable, map} from 'rxjs';

import {HsLayerEditorWidgetBaseComponent} from '../layer-editor-widget-base.component';
import {HsLayerSelectorService} from 'hslayers-ng/services/layer-manager';
import {
  getWmsOriginalExtent,
  setWmsOriginalExtent,
} from 'hslayers-ng/common/extensions';
import {getLayerParams, isLayerWMS} from 'hslayers-ng/services/utils';

@Component({
  selector: 'hs-extent-widget',
  templateUrl: './extent-widget.component.html',
  standalone: false,
})
export class HsExtentWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  name = 'extent-widget';

  ignoreExtent: boolean;
  isEnabled: Observable<boolean>;
  constructor(hsLayerSelectorService: HsLayerSelectorService) {
    super(hsLayerSelectorService);
    this.isEnabled = this.layerDescriptor.pipe(
      map((l) => {
        const originalExtent = getWmsOriginalExtent(l.layer);
        const isAllowed = originalExtent ?? isLayerWMS(l.layer);
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
    const params = getLayerParams(this.olLayer);
    this.olLayer
      .getSource()
      ['updateParams']({...params, ignoreExtent: this.ignoreExtent});
  }
}
