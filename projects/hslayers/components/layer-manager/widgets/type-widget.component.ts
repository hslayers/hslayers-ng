import {AsyncPipe} from '@angular/common';
import {Component} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsClipboardTextComponent} from 'hslayers-ng/common/clipboard-text';

@Component({
  selector: 'hs-type-widget',
  templateUrl: './type-widget.component.html',

  imports: [HsClipboardTextComponent, TranslatePipe, AsyncPipe],
})
export class HsTypeWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  showCheck = false;
  name = 'type-widget';
}
