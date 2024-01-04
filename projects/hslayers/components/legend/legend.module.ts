import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsLegendComponent} from './legend.component';
import {HsLegendLayerComponent} from './legend-layer/legend-layer.component';
import {HsLegendLayerStaticComponent} from './legend-layer-static/legend-layer-static.component';
import {HsLegendLayerVectorComponent} from './legend-layer-vector/legend-layer-vector.component';
import {HsPanelHeaderComponent} from '../../common/panels/panel-header/panel-header.component';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsQueuesModule} from 'hslayers-ng/shared/queues';
import {HsUiExtensionsModule} from 'hslayers-ng/common/widgets';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsLegendComponent,
    HsLegendLayerComponent,
    HsLegendLayerVectorComponent,
    HsLegendLayerStaticComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    HsUiExtensionsModule,
    TranslateCustomPipe,
    HsQueuesModule,
    HsPanelHeaderComponent,
  ],
  exports: [HsLegendComponent, HsLegendLayerComponent],
})
export class HsLegendModule {}
