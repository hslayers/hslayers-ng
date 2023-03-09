import {Component} from '@angular/core';

import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerSelectorService} from '../editor/layer-selector.service';

@Component({
  selector: 'hs-opacity-widget',
  templateUrl: './opacity-widget.component.html',
})
export class HsOpacityWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  name = 'opacity-widget';
  constructor(
    hsLayerSelectorService: HsLayerSelectorService,
    private hsEventBusService: HsEventBusService
  ) {
    super(hsLayerSelectorService);
  }

  /**
   * Set selected layer's opacity and emits "compositionchanged"
   * @param newValue
   */
  set opacity(newValue) {
    if (!this.layerDescriptor) {
      return;
    }
    this.olLayer.setOpacity(newValue);
    this.hsEventBusService.compositionEdits.next();
  }

  get opacity() {
    return this.olLayer.getOpacity();
  }
}
