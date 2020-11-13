import * as merge from 'deepmerge';
import {HsCommonEndpointsModule} from '../../common/endpoints';
import {HsCompositionsModule} from '../compositions';
import {HsConfig} from '../../config.service';
import {HsConfirmModule} from './../../common/confirm';
import {HsCoreService} from './core.service';
import {HsDatasourcesModule} from '../datasource-selector';
import {HsDragModule} from './../drag/drag.module';
import {HsDrawModule} from '../draw';
import {HsFeatureTableModule} from './../feature-table';
import {HsGeolocationModule} from './../geolocation';
import {HsHistoryListModule} from './../../common/history-list';
import {HsInfoModule} from './../info';
import {HsLanguageModule} from './../language';
import {HsLayerManagerModule} from '../layermanager';
import {HsLaymanModule} from '../../common/layman';
import {HsLayoutModule} from '../layout/';
import {HsLegendModule} from '../legend';
import {HsLogModule} from '../../common/log/log.module';
import {HsMapModule} from '../map';
import {HsMeasureModule} from '../measure';
import {HsPrintModule} from '../print';
import {HsQueryModule} from '../query';
import {HsSaveMapModule} from '../save-map';
import {HsSearchModule} from './../search';
import {HsShareModule} from '../permalink';
import {HsSidebarModule} from '../sidebar';
import {HsStylerModule} from '../styles';
import {HsToolbarModule} from '../toolbar/toolbar.module';
import {HsTripPlannerModule} from '../trip_planner';
import {HsUtilsModule} from './../utils';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {Observable, forkJoin, from} from 'rxjs';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
  TranslateStore,
} from '@ngx-translate/core';
import {map} from 'rxjs/operators';

export class WebpackTranslateLoader implements TranslateLoader {
  constructor(private HsConfig: HsConfig) {}

  getTranslation(lang: string): any {
    //Idea taken from https://github.com/denniske/ngx-translate-multi-http-loader/blob/master/projects/ngx-translate/multi-http-loader/src/lib/multi-http-loader.ts
    const requests: Observable<any>[] = [
      from(import(`../../assets/locales/${lang}.json`)),
      from(
        new Promise((resolve) => {
          if (
            this.HsConfig.translationOverrides &&
            this.HsConfig.translationOverrides[lang]
          ) {
            resolve(this.HsConfig.translationOverrides[lang]);
          } else {
            resolve({});
          }
        })
      ),
    ];
    const tmp = forkJoin(requests).pipe(map((response) => merge.all(response)));
    return tmp;
  }
}

@NgModule({
  declarations: [],
  imports: [
    HsFeatureTableModule,
    HsGeolocationModule,
    HttpClientModule,
    HsDatasourcesModule,
    HsLayoutModule,
    HsLegendModule,
    HsMeasureModule,
    HsDrawModule,
    HsDragModule,
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
    HsCompositionsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (HsConfig: HsConfig) => {
          return new WebpackTranslateLoader(HsConfig);
        },
        multi: false,
        deps: [HsConfig],
      },
    }),
    HsInfoModule,
    HsQueryModule,
    HsConfirmModule,
    HsMapModule,
    HsLaymanModule,
    HsTripPlannerModule,
    HsCommonEndpointsModule,
  ],
  exports: [TranslateModule],
  providers: [HsCoreService, TranslateStore, TranslateService, HsConfig],
  entryComponents: [],
})
export class HsCoreModule {
  constructor() {}
}
