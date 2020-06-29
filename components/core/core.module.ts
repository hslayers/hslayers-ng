/**
* @namespace hs.legend
* @memberOf hs
*/
import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { BrowserModule } from '@angular/platform-browser';
import { HsCoreService } from './core.service';
import { HsLogService } from './log.service';
import { HsLayoutModule } from '../layout/layout.module';
import { HsMapServiceProvider, HsUtilsServiceProvider, HsConfigProvider, HsDrawServiceProvider, HsStylerServiceProvider, HsLayerSynchronizerServiceProvider, HsWmsGetCapabilitiesServiceProvider, HsWfsGetCapabilitiesServiceProvider, HsWmtsGetCapabilitiesServiceProvider, HsDimensionServiceProvider, HsLayerUtilsServiceProvider } from '../../ajs-upgraded-providers';
import { HsLegendModule } from '../legend';
import { HsPrintModule } from '../print';
import { HsLayerManagerModule } from '../layermanager';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    BrowserModule,
    HsLayoutModule,
    HsLegendModule,
    HsPrintModule,
    HsLayerManagerModule
  ],
  exports: [
  ],
  providers: [
    HsCoreService,
    HsMapServiceProvider,
    HsConfigProvider,
    HsUtilsServiceProvider,
    HsLayerUtilsServiceProvider,
    HsStylerServiceProvider,
    HsDrawServiceProvider,
    HsLayerSynchronizerServiceProvider,
    HsWmsGetCapabilitiesServiceProvider, 
    HsWfsGetCapabilitiesServiceProvider, 
    HsWmtsGetCapabilitiesServiceProvider,
    HsDimensionServiceProvider,
    {
      provide: Window, useValue: window
    },
    HsLogService],
  entryComponents: [
  ]
})
export class HsCoreModule {
}


