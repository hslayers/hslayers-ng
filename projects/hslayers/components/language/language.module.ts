import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {
  TranslateLoader,
  TranslateModule,
  TranslateStore,
} from '@ngx-translate/core';

import {HsConfig} from '../../config.service';
import {HsLanguageComponent} from './language.component';
import {HsLogService} from '../../common/log/log.service';
import {HsPanelHeaderComponent} from '../layout/panels/panel-header/panel-header.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {WebpackTranslateLoader} from './custom-translate.service';

export function getWebpackTranslateLoader(
  hsConfig: HsConfig,
  hsLog: HsLogService,
  httpClient: HttpClient,
): WebpackTranslateLoader {
  return new WebpackTranslateLoader(hsConfig, hsLog, httpClient);
}

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsLanguageComponent],
  imports: [
    FormsModule,
    CommonModule,
    TranslateModule,
    HsPanelHelpersModule,
    HsPanelHeaderComponent,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: getWebpackTranslateLoader,
        multi: false,
        deps: [HsConfig, HttpClient],
      },
    }),
  ],
  exports: [HsLanguageComponent],
  providers: [TranslateStore],
})
export class HsLanguageModule {}
