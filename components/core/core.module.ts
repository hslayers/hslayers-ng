import {
  HsCommonEndpointsServiceProvider,
  HsCommonLaymanServiceProvider,
  HsCompositionsParserServiceProvider,
  HsConfigProvider,
  HsDimensionServiceProvider,
  HsWfsGetCapabilitiesServiceProvider,
  HsWmsGetCapabilitiesServiceProvider,
  HsWmtsGetCapabilitiesServiceProvider,
} from '../../ajs-upgraded-providers';
import {HsConfirmModule} from './../../common/confirm';
import {HsCoreService} from './core.service';
import {HsDatasourcesModule} from '../datasource-selector';
import {HsDrawModule} from '../draw';
import {HsDrawService} from '../draw/draw.service';
import {HsGeolocationModule} from './../geolocation';
import {HsHistoryListModule} from './../../common/history-list';
import {HsInfoModule} from './../info';
import {HsLanguageModule} from './../language';
import {HsLayerManagerModule} from '../layermanager';
import {HsLayoutModule} from '../layout/layout.module';
import {HsLegendModule} from '../legend';
import {HsLogModule} from '../../common/log/log.module';
import {HsMapModule} from '../map';
import {HsMeasureModule} from '../measure';
import {HsPrintModule} from '../print';
import {HsQueryModule} from '../query';
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
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
  TranslateStore,
} from '@ngx-translate/core';
import {from} from 'rxjs';

export class WebpackTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): any {
    return from(import(`../../assets/locales/${lang}.json`));
  }
}

@NgModule({
  declarations: [],
  imports: [
    HsGeolocationModule,
    HttpClientModule,
    HsDatasourcesModule,
    HsLayoutModule,
    HsLegendModule,
    HsMeasureModule,
    HsDrawModule,
    HsSidebarModule,
    HsHistoryListModule,
    HsStylerModule,
    HsPrintModule,
    HsLayerManagerModule,
    HsLanguageModule,
    HsSaveMapModule,
    HsLogModule,
    HsShareModule,
    HsSearchModule,
    HsUtilsModule,
    HsToolbarModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useClass: WebpackTranslateLoader,
        multi: false,
      },
    }),
    HsInfoModule,
    HsQueryModule,
    HsConfirmModule,
    HsMapModule,
  ],
  exports: [TranslateModule],
  providers: [
    HsCoreService,
    HsSearchService,
    HsDrawService,
    TranslateStore,
    TranslateService,
    HsConfigProvider,
    HsCompositionsParserServiceProvider,
    HsWmsGetCapabilitiesServiceProvider,
    HsWfsGetCapabilitiesServiceProvider,
    HsWmtsGetCapabilitiesServiceProvider,
    HsDimensionServiceProvider,
    {
      provide: Window,
      useValue: window,
    },
    HsCommonEndpointsServiceProvider,
    HsCommonLaymanServiceProvider,
  ],
  entryComponents: [],
})
export class HsCoreModule {
  constructor() {}
}
