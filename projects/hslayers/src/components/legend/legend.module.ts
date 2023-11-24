import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsLegendComponent} from './legend.component';
import {HsLegendLayerComponent} from './legend-layer/legend-layer.component';
import {HsLegendLayerStaticComponent} from './legend-layer-static/legend-layer-static.component';
import {HsLegendLayerVectorComponent} from './legend-layer-vector/legend-layer-vector.component';
import {HsPanelHeaderComponent} from '../layout//panels/panel-header/panel-header.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsQueuesModule} from '../../common/queues/queues.module';
import {HsUiExtensionsModule} from '../../common/widgets/ui-extensions.module';
import {TranslateCustomPipe} from '../language/translate-custom.pipe';
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
