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
import {HsToolbarModule} from '../toolbar/toolbar.module';
import {HsUtilsModule} from './../utils';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {
  TranslateLoader,
  TranslateModule,
  TranslateStore,
} from '../../node_modules/@ngx-translate/core';
import {TranslateService} from '../../node_modules/@ngx-translate/core';

import {from} from 'rxjs';

export class WebpackTranslateLoader implements TranslateLoader {
  getTranslation(lang: string) {
    return from(import(`../../assets/locales/${lang}.json`));
  }
}

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
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useClass: WebpackTranslateLoader,
        multi: false,
      },
    }),
  ],
  exports: [TranslateModule],
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
    TranslateStore,
  ],
  entryComponents: [],
})
export class HsCoreModule {
  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'cz']);
    console.log(this.translate);
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }
}
