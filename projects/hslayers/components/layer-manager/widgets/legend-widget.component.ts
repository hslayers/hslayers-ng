import {Component, inject} from '@angular/core';

import {HsLayerEditorService} from '../editor/layer-editor.service';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLegendLayerComponent} from 'hslayers-ng/components/legend';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'hs-legend-widget',
  templateUrl: './legend-widget.component.html',
  styleUrls: ['./layer-editor-widgets.component.scss'],
  styles: [
    `
      .hs-widget-legend hs-legend-layer {
        display: block;
        width: 100%;
      }
    `,
  ],

  imports: [HsLegendLayerComponent, TranslatePipe],
})
export class HsLegendWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  hsLayerEditorService = inject(HsLayerEditorService);

  name = 'legend-widget';
}
