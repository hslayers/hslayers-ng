import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FilterPipe} from 'hslayers-ng/common/pipes';
import {FormsModule} from '@angular/forms';
import {HsLegendComponent} from './legend.component';
import {HsLegendLayerComponent} from './legend-layer/legend-layer.component';
import {HsLegendLayerStaticComponent} from './legend-layer-static/legend-layer-static.component';
import {HsLegendLayerVectorComponent} from './legend-layer-vector/legend-layer-vector.component';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HttpClientModule} from '@angular/common/http';
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
    HttpClientModule,
    HsPanelHelpersModule,
    FilterPipe,
    TranslateCustomPipe,
    HsPanelHeaderComponent,
  ],
  exports: [HsLegendComponent, HsLegendLayerComponent],
})
export class HsLegendModule {}
