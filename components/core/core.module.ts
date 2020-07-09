/**
 * @namespace hs.legend
 * @memberOf hs
 */
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {
  HsConfigProvider,
  HsDimensionServiceProvider,
  HsDrawServiceProvider,
  HsLayerSynchronizerServiceProvider,
  HsLayerUtilsServiceProvider,
  HsMapServiceProvider,
  HsStylerServiceProvider,
  HsUtilsServiceProvider,
  HsWfsGetCapabilitiesServiceProvider,
  HsWmsGetCapabilitiesServiceProvider,
  HsWmtsGetCapabilitiesServiceProvider,
} from '../../ajs-upgraded-providers';
import {HsCoreService} from './core.service';
import {HsLayerManagerModule} from '../layermanager';
import {HsLayoutModule} from '../layout/layout.module';
import {HsLegendModule} from '../legend';
import {HsLogService} from './log.service';
import {HsMeasureModule} from '../measure';
import {HsPrintModule} from '../print';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    HsLayoutModule,
    HsLegendModule,
    HsMeasureModule,
    HsPrintModule,
    HsLayerManagerModule,
  ],
  exports: [],
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
      provide: Window,
      useValue: window,
    },
    HsLogService,
  ],
  entryComponents: [],
})
export class HsCoreModule {}
