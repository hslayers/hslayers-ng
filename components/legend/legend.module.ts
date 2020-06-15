/**
 * @namespace hs.legend
 * @memberOf hs
 */
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HsLegendComponent } from './legend.component';
import { HsLegendService } from './legend.service';
import { CommonModule } from "@angular/common";
import { HsPanelHelpersModule } from '../layout/panel-helpers.module';
import { HsLegendLayerComponent } from './legend-layer.component';
import { HsLegendLayerVectorComponent } from './legend-layer-vector.component';
import { BrowserModule } from '@angular/platform-browser';
import { HsLegendLayerStaticComponent } from './legend-layer-static.component';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsLegendComponent,
    HsLegendLayerComponent,
    HsLegendLayerVectorComponent,
    HsLegendLayerStaticComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    HsPanelHelpersModule
  ],
  exports: [
    HsLegendComponent,
    HsLegendLayerComponent
  ],
  providers: [HsLegendService],
  entryComponents: [
    HsLegendComponent,
    HsLegendLayerComponent
  ]
})
export class HsLegendModule {
}


