import {Component, ViewRef} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerSelectorService} from '../editor/layer-selector.service';
import {HsPanelComponent} from '../../layout/panels/panel-component.interface';
@Component({
  template: '<div></div>',
})
export class HsLayerEditorWidgetBaseComponent implements HsPanelComponent {
  name: string; //This could be used to enable/disable widgets by name on HsConfig level
  viewRef: ViewRef;
  data: any;
  currentLayer: HsLayerDescriptor;
  constructor(hsLayerSelectorService: HsLayerSelectorService) {
    this.currentLayer = hsLayerSelectorService.currentLayer;
    hsLayerSelectorService.layerSelected.subscribe((layerDescriptor) => {
      this.currentLayer = layerDescriptor;
    });
  }
  isVisible(): boolean {
    return true;
  }

  olLayer(): Layer<Source> {
    if (!this.currentLayer) {
      return undefined;
    }
    return this.currentLayer.layer;
  }
}
