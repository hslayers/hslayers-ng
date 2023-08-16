import {Component} from '@angular/core';

import {HsLanguageService} from '../../language/language.service';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerSelectorService} from '../editor/layer-selector.service';

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
