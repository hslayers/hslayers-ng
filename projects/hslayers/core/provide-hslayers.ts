import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {EnvironmentProviders, makeEnvironmentProviders} from '@angular/core';
import {
  provideMissingTranslationHandler,
  provideTranslateService,
  TranslateLoader,
} from '@ngx-translate/core';

import {HsConfig} from 'hslayers-ng/config';
import {
  HsMissingTranslationHandler,
  HsTranslateLoader,
} from 'hslayers-ng/services/language';
import {HsAuthInterceptor} from './auth.interceptor';

/**
 * Application-level providers required by hslayers-ng: `HttpClient` with
 * {@link HsAuthInterceptor}, and ngx-translate with {@link HsTranslateLoader} plus
 * {@link HsMissingTranslationHandler}.
 *
 * Pass into `bootstrapModule(..., { applicationProviders: [...] })` (or the equivalent root
 * `EnvironmentProviders` list) when using standalone {@link HslayersComponent}.
 */
export function provideHslayers(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withInterceptors([HsAuthInterceptor])),
    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useClass: HsTranslateLoader,
        deps: [HsConfig, HttpClient],
      },
      missingTranslationHandler: provideMissingTranslationHandler(
        HsMissingTranslationHandler,
      ),
    }),
  ]);
}
