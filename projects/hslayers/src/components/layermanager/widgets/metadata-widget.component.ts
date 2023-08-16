import {Component} from '@angular/core';

import {HsLanguageService} from '../../language/language.service';
import {HsLayerDescriptor} from './../layer-descriptor.interface';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerManagerMetadataService} from './../layermanager-metadata.service';
import {HsLayerManagerService} from '../layermanager.service';
import {HsLayerSelectorService} from '../editor/layer-selector.service';
import {getAbstract, setAbstract} from '../../../common/layer-extensions';
import {getAttribution} from '../../../common/layer-extensions';

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
