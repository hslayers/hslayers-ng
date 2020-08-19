/**
 * @namespace hs.legend
 * @memberOf hs
 */
import {BrowserModule} from '@angular/platform-browser';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsLegendComponent} from './legend.component';
import {HsLegendLayerComponent} from './legend-layer.component';
import {HsLegendLayerStaticComponent} from './legend-layer-static.component';
import {HsLegendLayerVectorComponent} from './legend-layer-vector.component';
import {HsLegendService} from './legend.service';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsLegendComponent,
    HsLegendLayerComponent,
    HsLegendLayerVectorComponent,
    HsLegendLayerStaticComponent,
  ],
  imports: [CommonModule, BrowserModule, HsPanelHelpersModule],
  exports: [HsLegendComponent, HsLegendLayerComponent],
  providers: [HsLegendService],
  entryComponents: [HsLegendComponent, HsLegendLayerComponent],
})
export class HsLegendModule {}
