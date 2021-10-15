import {NgModule} from '@angular/core';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {Observable, forkJoin, from} from 'rxjs';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
  TranslateStore,
} from '@ngx-translate/core';
import {map} from 'rxjs/operators';

import * as merge from 'deepmerge';

import {HsCommonEndpointsModule} from '../../common/endpoints/endpoints.module';
import {HsConfig} from '../../config.service';
import {HsConfirmModule} from './../../common/confirm/confirm.module';
import {HsHistoryListModule} from './../../common/history-list/history-list.module';
import {HsLayoutModule} from '../layout/layout.module';
import {HsLogModule} from '../../common/log/log.module';
import {HsMapModule} from '../map/map.module';
import {HsSidebarModule} from '../sidebar/sidebar.module';
import {HsUtilsModule} from './../utils/utils.module';

export class WebpackTranslateLoader implements TranslateLoader {
  constructor(public HsConfig: HsConfig, private HttpClient: HttpClient) {}

  getTranslation(lang: string): any {
    const hsConfig = this.HsConfig;
    //Idea taken from https://github.com/denniske/ngx-translate-multi-http-loader/blob/master/projects/ngx-translate/multi-http-loader/src/lib/multi-http-loader.ts
    const requests: Observable<any>[] = [
      from(
        new Promise(async (resolve) => {
          const res = await this.HttpClient.get(
            `${this.HsConfig.assetsPath}/locales/${lang}.json`
            ).toPromise();
          resolve(res);
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
  HsConfig: HsConfig,
  HttpClient: HttpClient
): WebpackTranslateLoader {
  return new WebpackTranslateLoader(HsConfig, HttpClient);
}

@NgModule({
  declarations: [],
  imports: [
    HttpClientModule,
    HsLayoutModule,
    HsSidebarModule,
    HsHistoryListModule,
    HsLogModule,
    HsUtilsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: getWebpackTranslateLoader,
        multi: false,
        deps: [HsConfig, HttpClient],
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
