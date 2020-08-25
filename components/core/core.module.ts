import {BrowserModule} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {
  HsAddLayersVectorServiceProvider,
  HsCommonEndpointsServiceProvider,
  HsCommonLaymanServiceProvider,
  HsConfigProvider,
  HsDimensionServiceProvider,
  HsLanguageServiceProvider,
  HsMapServiceProvider,
  HsQueryBaseServiceProvider,
  HsQueryVectorServiceProvider,
  HsWfsGetCapabilitiesServiceProvider,
  HsWmsGetCapabilitiesServiceProvider,
  HsWmtsGetCapabilitiesServiceProvider,
} from '../../ajs-upgraded-providers';
import {HsCoreService} from './core.service';
import {HsDatasourcesModule} from '../datasource-selector';
import {HsDrawModule} from '../draw';
import {HsDrawService} from '../draw/draw.service';
import {HsLayerManagerModule} from '../layermanager';
import {HsLayoutModule} from '../layout/layout.module';
import {HsLegendModule} from '../legend';
import {HsLogModule} from '../../common/log/log.module';
import {HsMeasureModule} from '../measure';
import {HsPrintModule} from '../print';
import {HsSaveMapModule} from '../save-map';
import {HsSearchModule} from './../search';
import {HsSearchService} from './../search/search.service';
import {HsShareModule} from '../permalink';
import {HsSidebarModule} from '../sidebar';
import {HsStylerModule} from '../styles';
import {HsToolbarModule} from '../toolbar/toolbar.module';
import {HsUtilsModule} from './../utils';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    HsDatasourcesModule,
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
    HsSearchModule,
    HsUtilsModule,
    HsToolbarModule,
  ],
  exports: [],
  providers: [
    HsCoreService,
    HsSearchService,
    HsDrawService,
    HsAddLayersVectorServiceProvider,
    HsMapServiceProvider,
    HsConfigProvider,
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
