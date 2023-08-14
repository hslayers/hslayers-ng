import {Component} from '@angular/core';
import {HsLayerEditorWidgetBaseComponent} from '../layer-editor-widget-base.component';
import {HsLayerSelectorService} from '../../editor/layer-selector.service';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {
  getWmsExtentStash,
  setWmsExtentStash,
} from '../../../../common/layer-extensions';
import {map} from 'rxjs';

@Component({
  selector: 'hs-extent-widget',
  templateUrl: './extent-widget.component.html',
})
export class HsExtentWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  name = 'extent-widget';

  ignoreExtent: boolean;
  isEnabled;
  constructor(
    hsLayerSelectorService: HsLayerSelectorService,
    private hsLayerUtilsService: HsLayerUtilsService,
  ) {
    super(hsLayerSelectorService);
    this.isEnabled = this.layerDescriptor.pipe(
      map((l) => {
        const extentStash = getWmsExtentStash(l.layer);
        const isAllowed =
          extentStash ?? this.hsLayerUtilsService.isLayerWMS(l.layer);
        if (isAllowed) {
          const extent = l.layer.getExtent();
          /**
           * Init with true only if no Extent + Stash (extent has been ignored by user before)
           */
          this.ignoreExtent = !extent && !!extentStash ? true : false;
          if (!extentStash) {
            setWmsExtentStash(l.layer, extent);
          }
          /**
           * Show widget if extent or stash is available
           */
          return !!extentStash || !!extent;
        }
        return false;
      }),
    );
  }

  toggleIgnoreExtent(): void {
    this.ignoreExtent = !this.ignoreExtent;
    this.olLayer.setExtent(
      this.ignoreExtent ? undefined : getWmsExtentStash(this.olLayer),
    );
  }
}
