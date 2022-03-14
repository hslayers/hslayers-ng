import {Component, OnInit, ViewRef} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerSelectorService} from '../editor/layer-selector.service';
import {HsPanelComponent} from '../../layout/panels/panel-component.interface';
@Component({
  template: '<div></div>',
})
export class HsLayerEditorWidgetBaseComponent
  implements HsPanelComponent, OnInit {
  name: string; //This could be used to enable/disable widgets by name on HsConfig level
  viewRef: ViewRef;
  data: any;
  currentLayer: HsLayerDescriptor;
  constructor(public hsLayerSelectorService: HsLayerSelectorService) {}
  ngOnInit() {
    this.currentLayer = this.hsLayerSelectorService.get(
      this.data.app
    ).currentLayer;

    this.hsLayerSelectorService.layerSelected.subscribe(({layer, app}) => {
      if (app == this.data.app) {
        this.currentLayer = layer;
      }
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
