/**
 * @namespace hs.legend
 * @memberOf hs
 */
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {
  HsConfigProvider,
  HsDimensionServiceProvider,
  HsLayerSynchronizerServiceProvider,
  HsLayerUtilsServiceProvider,
  HsMapServiceProvider,
  HsQueryBaseServiceProvider,
  HsQueryVectorServiceProvider,
  HsUtilsServiceProvider,
  HsWfsGetCapabilitiesServiceProvider,
  HsWmsGetCapabilitiesServiceProvider,
  HsWmtsGetCapabilitiesServiceProvider,
} from '../../ajs-upgraded-providers';
import {HsCoreService} from './core.service';
import {HsDrawModule} from '../draw';
import {HsDrawService} from '../draw/draw.service';
import {HsLayerManagerModule} from '../layermanager';
import {HsLayoutModule} from '../layout/layout.module';
import {HsLegendModule} from '../legend';
import {HsLogService} from './log.service';
import {HsMeasureModule} from '../measure';
import {HsPrintModule} from '../print';
import {HsStylerModule} from '../styles';
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
    HsDrawModule,
    HsStylerModule,
    HsPrintModule,
    HsLayerManagerModule,
  ],
  exports: [],
  providers: [
    HsCoreService,
    HsDrawService,
    HsMapServiceProvider,
    HsConfigProvider,
    HsUtilsServiceProvider,
    HsLayerUtilsServiceProvider,
    HsLayerSynchronizerServiceProvider,
    HsWmsGetCapabilitiesServiceProvider,
    HsWfsGetCapabilitiesServiceProvider,
    HsWmtsGetCapabilitiesServiceProvider,
    HsDimensionServiceProvider,
    HsQueryVectorServiceProvider,
    HsQueryBaseServiceProvider,
    {
      provide: Window,
      useValue: window,
    },
    HsLogService,
  ],
  entryComponents: [],
})
export class HsCoreModule {}
