import {Component, inject} from '@angular/core';

import {HsLayerEditorService} from '../editor/layer-editor.service';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';

@Component({
  selector: 'hs-legend-widget',
  templateUrl: './legend-widget.component.html',
  standalone: false,
})
export class HsLegendWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  hsLayerEditorService = inject(HsLayerEditorService);

  name = 'legend-widget';
}
