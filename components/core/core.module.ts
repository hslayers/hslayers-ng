/**
 * @namespace hs.legend
 * @memberOf hs
 */
import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {
  HsCommonEndpointsServiceProvider,
  HsCommonLaymanServiceProvider,
  HsConfigProvider,
  HsDimensionServiceProvider,
  HsLanguageServiceProvider,
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
import {HsLogModule} from '../../common/log/log.module';
import {HsMeasureModule} from '../measure';
import {HsPrintModule} from '../print';
import {HsSaveMapModule} from '../save-map';
import {HsShareModule} from '../permalink';
import {HsSidebarModule} from '../sidebar';
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
    HsSidebarModule,
    HsStylerModule,
    HsPrintModule,
    HsLayerManagerModule,
    HsSaveMapModule,
    HsLogModule,
    HsShareModule,
  ],
  exports: [],
  providers: [
    HsCoreService,
    HsDrawService,
    HsMapServiceProvider,
    HsConfigProvider,
    HsUtilsServiceProvider,
    HsLayerUtilsServiceProvider,
    HsWmsGetCapabilitiesServiceProvider,
    HsWfsGetCapabilitiesServiceProvider,
    HsWmtsGetCapabilitiesServiceProvider,
    HsDimensionServiceProvider,
    HsQueryVectorServiceProvider,
    HsQueryBaseServiceProvider,
    HsLanguageServiceProvider,
    {
      provide: Window,
      useValue: window,
    },
    HsCommonEndpointsServiceProvider,
    HsCommonLaymanServiceProvider,
  ],
  entryComponents: [],
})
export class HsCoreModule {}
