import {Component, inject, signal} from '@angular/core';

import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerSelectorService} from 'hslayers-ng/services/layer-manager';
import {HsToastService} from 'hslayers-ng/common/toast';

@Component({
  selector: 'hs-type-widget',
  templateUrl: './type-widget.component.html',
})
export class HsTypeWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  hsToastService = inject(HsToastService);

  showCheck = false;

  constructor(hsLayerSelectorService: HsLayerSelectorService) {
    super(hsLayerSelectorService);
  }
  name = 'type-widget';

  copyToClipBoard() {
    if (!navigator.clipboard) {
      this.hsToastService.createToastPopupMessage(
        'COMMON.copyToClipboard',
        'COMMON.copyToClipboardFailure',
        {
          toastStyleClasses: 'bg-danger text-white',
        },
      );
      return;
    }
    this.showCheck = true;
    const source = this.hsLayerSelectorService.currentLayer.source;
    navigator.clipboard.writeText(source);
    setTimeout(() => {
      this.showCheck = false;
    }, 500);
  }
}
