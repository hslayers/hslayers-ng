import {Component, inject} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';

@Component({
  selector: 'hs-opacity-widget',
  templateUrl: './opacity-widget.component.html',
  styleUrls: ['./layer-editor-widgets.component.scss'],
  styles: [
    `
      .hs-widget-opacity .form-range {
        cursor: pointer;
        background: linear-gradient(
          to right,
          var(--bs-primary) 0%,
          var(--bs-primary) var(--opacity-percentage, 100%),
          rgba(0, 0, 0, 0.1) var(--opacity-percentage, 100%),
          rgba(0, 0, 0, 0.1) 100%
        );
        height: 0.5rem;
        border-radius: 0.25rem;
      }

      .hs-widget-opacity .form-range::-webkit-slider-thumb {
        height: 1.25rem;
        width: 1.25rem;
        background: #fff;
        border: 2px solid var(--bs-primary);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
      }

      .hs-widget-opacity .form-range::-moz-range-thumb {
        height: 1.25rem;
        width: 1.25rem;
        background: #fff;
        border: 2px solid var(--bs-primary);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
      }

      .hs-widget-opacity .form-range:hover::-webkit-slider-thumb {
        transform: scale(1.1);
      }

      .hs-widget-opacity .form-range:hover::-moz-range-thumb {
        transform: scale(1.1);
      }

      .hs-widget-opacity .form-range::-webkit-slider-runnable-track {
        background: transparent;
      }

      .hs-widget-opacity .form-range::-moz-range-track {
        background: transparent;
      }
    `,
  ],

  imports: [FormsModule, TranslatePipe, DecimalPipe],
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
