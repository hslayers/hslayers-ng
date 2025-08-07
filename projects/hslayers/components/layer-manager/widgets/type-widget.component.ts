import {Component} from '@angular/core';

import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';

@Component({
  selector: 'hs-type-widget',
  templateUrl: './type-widget.component.html',
  standalone: false,
})
export class HsTypeWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  showCheck = false;
  name = 'type-widget';
}
