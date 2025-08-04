import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {
  TranslateLoader,
  TranslateModule,
  TranslateStore,
} from '@ngx-translate/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsLanguageComponent} from './language.component';
import {HsLogService} from 'hslayers-ng/services/log';
import {
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';
import {WebpackTranslateLoader} from 'hslayers-ng/services/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsLanguageComponent],
  imports: [
    FormsModule,
    CommonModule,
    HsPanelHelpersModule,
    HsPanelHeaderComponent,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useClass: WebpackTranslateLoader,
        multi: false,
        deps: [HsConfig, HttpClient],
      },
    }),
  ],
  exports: [HsLanguageComponent],
  providers: [TranslateStore],
})
export class HsLanguageModule {}
