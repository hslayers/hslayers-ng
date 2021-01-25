import * as merge from 'deepmerge';
import cs from '../../assets/locales/cs.json';
import en from '../../assets/locales/en.json';
import lv from '../../assets/locales/lv.json';
import {HsCommonEndpointsModule} from '../../common/endpoints/endpoints.module';
import {HsCompositionsModule} from '../compositions/compositions.module';
import {HsConfig} from '../../config.service';
import {HsConfirmModule} from './../../common/confirm/confirm.module';
import {HsCoreService} from './core.service';
import {HsAddDataModule} from '../data/add-data.module';
import {HsDatasourcesModule} from '../datasource-selector/datasource-selector.module';
import {HsDragModule} from './../drag/drag.module';
import {HsDrawModule} from '../draw/draw.module';
import {HsFeatureTableModule} from './../feature-table/feature-table.module';
import {HsGeolocationModule} from './../geolocation/geolocation.module';
import {HsHistoryListModule} from './../../common/history-list/history-list.module';
import {HsInfoModule} from './../info/info.module';
import {HsLanguageModule} from './../language/language.module';
import {HsLayerManagerModule} from '../layermanager/layermanager.module';
import {HsLaymanModule} from '../../common/layman/layman.module';
import {HsLayoutModule} from '../layout/layout.module';
import {HsLegendModule} from '../legend/legend.module';
import {HsLogModule} from '../../common/log/log.module';
import {HsMapModule} from '../map/map.module';
import {HsMeasureModule} from '../measure/measure.module';
import {HsPrintModule} from '../print/print.module';
import {HsQueryModule} from '../query/query.module';
import {HsSaveMapModule} from '../save-map/save-map.module';
import {HsSearchModule} from './../search/search.module';
import {HsShareModule} from '../permalink/share.module';
import {HsSidebarModule} from '../sidebar/sidebar.module';
import {HsStylerModule} from '../styles/styles.module';
import {HsToolbarModule} from '../toolbar/toolbar.module';
import {HsTripPlannerModule} from '../trip_planner/trip-planner.module';
import {HsUtilsModule} from './../utils/utils.module';
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
  constructor(public HsConfig: HsConfig) {}

  getTranslation(lang: string): any {
    const hsConfig = this.HsConfig;
    //Idea taken from https://github.com/denniske/ngx-translate-multi-http-loader/blob/master/projects/ngx-translate/multi-http-loader/src/lib/multi-http-loader.ts
    const requests: Observable<any>[] = [
      from(
        new Promise((resolve) => {
          switch (lang) {
            case 'lv':
              resolve(lv);
              break;
            default:
            case 'en':
              resolve(en);
              break;
            case 'cs':
              resolve(cs);
              break;
          }
        })
      ),
      from(
        new Promise((resolve) => {
          //Wait a bit for the HsConfig to be set from container app
          setTimeout((_) => {
            if (
              hsConfig.translationOverrides &&
              hsConfig.translationOverrides[lang]
            ) {
              resolve(hsConfig.translationOverrides[lang]);
            } else {
              resolve({});
            }
          }, 200);
        })
      ),
    ];
    const tmp = forkJoin(requests).pipe(
      map((response) => {
        return merge.all(response);
      })
    );
    return tmp;
  }
}

/**
 * @param HsConfig
 */
export function getWebpackTranslateLoader(
  HsConfig: HsConfig
): WebpackTranslateLoader {
  return new WebpackTranslateLoader(HsConfig);
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
    HsAddDataModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: getWebpackTranslateLoader,
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
