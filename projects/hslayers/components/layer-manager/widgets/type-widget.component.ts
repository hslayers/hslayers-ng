import {Component} from '@angular/core';

import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerSelectorService} from 'hslayers-ng/shared/layer-manager';

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
