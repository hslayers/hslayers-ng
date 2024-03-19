import {Component} from '@angular/core';

import {HsLayerEditorService} from '../editor/layer-editor.service';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerSelectorService} from 'hslayers-ng/services/layer-manager';

@Component({
  selector: 'hs-legend-widget',
  templateUrl: './legend-widget.component.html',
})
export class HsLegendWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  name = 'legend-widget';
  constructor(
    hsLayerSelectorService: HsLayerSelectorService,
    public HsLayerEditorService: HsLayerEditorService,
  ) {
    super(hsLayerSelectorService);
  }
}
