import * as merge from 'deepmerge';
import {
  FakeMissingTranslationHandler,
  TranslateDefaultParser,
  TranslateFakeCompiler,
  TranslateLoader,
  TranslateService,
} from '@ngx-translate/core';
import {HsConfig} from 'hslayers-ng/config';
import {HsLogService} from 'hslayers-ng/services/log';
import {HttpClient} from '@angular/common/http';
import {Injectable, signal} from '@angular/core';
import {Observable, forkJoin, interval, of, throwError} from 'rxjs';
import {catchError, filter, map, switchMap, take} from 'rxjs/operators';

/**
 * Custom loader for translations that works with webpack.
 * It loads translation files from the assets folder and merges them with any overrides.
 */
@Injectable({
  providedIn: 'root',
})
export class WebpackTranslateLoader implements TranslateLoader {
  /**
   * Map to keep track of loaded languages
   */
  loadedLanguages = signal<Record<string, boolean>>({});
  /**
   * List of languages loaded using APP_INITALIZATOR token
   * Considered as fully loaded from the start eg. no reload is necessary to load translation overrides
   */
  loadedViaInitializator: string[] = [];
  constructor(
    private hsConfig: HsConfig,
    private hsLog: HsLogService,
    private httpClient: HttpClient,
  ) {}

  /**
   * Loads the translations for a given language.
   * @param lang - language code in ISO 639-1 format such as `en`
   * @returns An Observable of the translation object for the specified language
   */
  getTranslation(lang: string): Observable<any> {
    return this.validateAssetsPath().pipe(
      switchMap(() => this.loadTranslations(lang)),
      map((translations) => {
        this.loadedLanguages.update((languages) => ({
          ...languages,
          [lang]: true,
        }));
        return translations;
      }),
      catchError((error) => {
        this.hsLog.error('Failed to load translations:', error);
        return of({});
      }),
    );
  }

  /**
   * Validates that the assets path is set in the configuration.
   * Retries up to 10 times with a 100ms interval if the path is not set - basically waits for config update.
   * @returns An Observable of the assets path or an error if not set after retries
   */
  private validateAssetsPath(): Observable<string> {
    if (this.hsConfig.assetsPath === undefined) {
      const errorMessage =
        'AssetsPath not set. Please set HsConfig.assetsPath correctly to enable loading of translation files.';
      return interval(100).pipe(
        switchMap((attempt) => {
          if (attempt >= 10) {
            return throwError(() => new Error(errorMessage));
          }
          return of(this.hsConfig.assetsPath);
        }),
        filter((assetsPath) => !!assetsPath),
        take(1),
      );
    } else {
      return of(this.hsConfig.assetsPath);
    }
  }

  /**
   * Loads translations for a specific language from the assets folder
   * and merges them with any overrides specified in the configuration.
   * @param lang - The language code to load translations for
   * @returns An Observable of the merged translations
   */
  private loadTranslations(lang: string): Observable<any> {
    const requests: Observable<any>[] = [
      this.httpClient
        .get(`${this.hsConfig.assetsPath}/locales/${lang}.json`)
        .pipe(catchError((error) => this.handleTranslationError(error, lang))),
      of(this.hsConfig.translationOverrides?.[lang] ?? {}),
    ];

    return forkJoin(requests).pipe(map((responses) => merge.all(responses)));
  }

  /**
   * Handles errors that occur when loading translation files.
   * @param error - The error object from the HTTP request
   * @param lang - The language code for which the error occurred
   * @returns An Observable of an empty object for 404 errors with additional languages, or throws an error otherwise
   */
  private handleTranslationError(error: any, lang: string): Observable<any> {
    let message = 'Probably an incorrect assetsPath...?';
    if (error.status === 404 && this.hsConfig.additionalLanguages?.[lang]) {
      message = 'Additional language not present in [assetsPath]/locales';
      return of({});
    }
    this.hsLog.log(`Locales files cannot be loaded. ${message}`);
    this.hsLog.error(error);
    return throwError(() => error);
  }
}

/**
 * Custom translation service that uses WebpackTranslateLoader to load translations.
 */
@Injectable({
  providedIn: 'root',
})
export class CustomTranslationService extends TranslateService {
  constructor(hsConfig: HsConfig, hsLog: HsLogService, httpClient: HttpClient) {
    super(
      null,
      new WebpackTranslateLoader(hsConfig, hsLog, httpClient),
      new TranslateFakeCompiler(),
      new TranslateDefaultParser(),
      new FakeMissingTranslationHandler(),
      false,
      true,
      false,
      null,
    );
  }
}
