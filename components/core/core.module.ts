/**
 * @namespace hs.legend
 * @memberOf hs
 */
import {
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
import {HsToolbarModule} from '../toolbar';
import {HsUtilsModule} from '../utils';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';

@NgModule({
  declarations: [],
  imports: [
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
    HsSearchModule,
    HsUtilsModule,
    HsToolbarModule,
  ],
  exports: [],
  providers: [
    HsCoreService,
    HsSearchService,
    HsDrawService,
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
