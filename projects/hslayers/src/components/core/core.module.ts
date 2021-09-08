import * as merge from 'deepmerge';
import cs from '../../assets/locales/cs.json';
import en from '../../assets/locales/en.json';
import lv from '../../assets/locales/lv.json';
import sk from '../../assets/locales/sk.json';
import {HsCommonEndpointsModule} from '../../common/endpoints/endpoints.module';
import {HsConfig} from '../../config.service';
import {HsConfirmModule} from './../../common/confirm/confirm.module';
import {HsDragModule} from './../drag/drag.module';
import {HsHistoryListModule} from './../../common/history-list/history-list.module';
import {HsLanguageModule} from './../language/language.module';
import {HsLayerManagerModule} from '../layermanager/layermanager.module';
import {HsLayoutModule} from '../layout/layout.module';
import {HsLogModule} from '../../common/log/log.module';
import {HsMapModule} from '../map/map.module';
import {HsSidebarModule} from '../sidebar/sidebar.module';
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
            case 'sk':
              resolve(sk);
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
    HttpClientModule,
    HsLayoutModule,
    HsDragModule,
    HsSidebarModule,
    HsHistoryListModule,
    HsLayerManagerModule,
    HsLanguageModule,
    HsLogModule,
    HsUtilsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: getWebpackTranslateLoader,
        multi: false,
        deps: [HsConfig],
      },
    }),
    HsConfirmModule,
    HsMapModule,
    HsCommonEndpointsModule,
  ],
  exports: [TranslateModule],
  providers: [TranslateStore, TranslateService, HsConfig],
  entryComponents: [],
})
export class HsCoreModule {
  constructor() {}
}
