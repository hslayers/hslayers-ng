import {Component, inject} from '@angular/core';

import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';

@Component({
  selector: 'hs-opacity-widget',
  templateUrl: './opacity-widget.component.html',
  standalone: false,
})
export class HsOpacityWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  private hsEventBusService = inject(HsEventBusService);

  name = 'opacity-widget';

  /**
   * Set selected layer's opacity and emits "compositionchanged"
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
