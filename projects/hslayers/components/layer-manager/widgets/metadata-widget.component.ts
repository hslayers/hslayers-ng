import {Component, inject} from '@angular/core';

import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {
  HsLayerManagerMetadataService,
  HsLayerManagerService,
} from 'hslayers-ng/services/layer-manager';
import {
  getAbstract,
  setAbstract,
  getAttribution,
} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-metadata-widget',
  templateUrl: './metadata-widget.component.html',
  standalone: false,
})
export class HsMetadataWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  hsLanguageService = inject(HsLanguageService);
  metadataService = inject(HsLayerManagerMetadataService);
  hsLayerManagerService = inject(HsLayerManagerService);

  name = 'metadata-widget';
  getAttribution = getAttribution;

  /**
   * Determines if layer has copyright information available
   * @param layer - Selected layer (HsLayerManagerService.currentLayer)
   */
  hasCopyright(layer: HsLayerDescriptor): boolean | undefined {
    if (!this.layerDescriptor) {
      return;
    }
    return getAttribution(layer.layer)?.onlineResource != undefined;
  }

  set abstract(newAbstract: string) {
    const layer = this.olLayer;
    if (layer == undefined) {
      return;
    }
    setAbstract(layer, newAbstract);
  }

  get abstract(): string {
    const layer = this.olLayer;
    if (layer == undefined) {
      return;
    }
    return getAbstract(layer);
  }
}
