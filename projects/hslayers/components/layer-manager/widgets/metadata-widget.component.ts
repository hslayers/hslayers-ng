import {Component} from '@angular/core';

import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerManagerMetadataService} from 'hslayers-ng/shared/layer-manager';
import {HsLayerManagerService} from 'hslayers-ng/shared/layer-manager';
import {HsLayerSelectorService} from 'hslayers-ng/shared/layer-manager';
import {getAbstract, setAbstract} from 'hslayers-ng/common/extensions';
import {getAttribution} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-metadata-widget',
  templateUrl: './metadata-widget.component.html',
})
export class HsMetadataWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  name = 'metadata-widget';
  getAttribution = getAttribution;

  constructor(
    public HsLanguageService: HsLanguageService,
    hsLayerSelectorService: HsLayerSelectorService,
    public metadataService: HsLayerManagerMetadataService,
    public HsLayerManagerService: HsLayerManagerService,
  ) {
    super(hsLayerSelectorService);
  }

  /**
   * Determines if layer has copyright information available
   * @param layer - Selected layer (HsLayerManagerService.currentLayer)
   */
  hasCopyright(layer: HsLayerDescriptor): boolean | undefined {
    if (!this.layerDescriptor) {
      return;
    } else {
      return getAttribution(layer.layer)?.onlineResource != undefined;
    }
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
