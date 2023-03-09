import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  CustomTranslationService,
  WebpackTranslateLoader,
} from './custom-translate.service';
import {FormsModule} from '@angular/forms';
import {HsConfig} from '../../config.service';
import {HsLanguageComponent} from './language.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HttpClient} from '@angular/common/http';
import {TranslateCustomPipe} from './translate-custom.pipe';
import {
  TranslateLoader,
  TranslateModule,
  TranslateStore,
} from '@ngx-translate/core';

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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsLanguageComponent, TranslateCustomPipe],
  imports: [
    FormsModule,
    CommonModule,
    TranslateModule,
    HsPanelHelpersModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: getWebpackTranslateLoader,
        multi: false,
        deps: [HsConfig, HttpClient],
      },
    }),
  ],
  exports: [HsLanguageComponent, TranslateCustomPipe],
  providers: [TranslateStore],
})
export class HsLanguageModule {}
