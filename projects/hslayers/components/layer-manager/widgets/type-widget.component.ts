import {Component} from '@angular/core';

import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerSelectorService} from 'hslayers-ng/services/layer-manager';

@Component({
  selector: 'hs-type-widget',
  templateUrl: './type-widget.component.html',
})
export class HsTypeWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  constructor(
    public HsLanguageService: HsLanguageService,
    hsLayerSelectorService: HsLayerSelectorService,
  ) {
    super(hsLayerSelectorService);
  }
  name = 'type-widget';
}
