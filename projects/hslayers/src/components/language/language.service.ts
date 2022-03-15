import {HttpClient} from '@angular/common/http';
import {Inject, Injectable} from '@angular/core';
import {lastValueFrom} from 'rxjs';

import {HsConfig} from '../../config.service';
import {CustomTranslationService as HsCustomTranslationService} from './custom-translate.service';

const DEFAULT_LANG = 'en';
class HsLangageObject {
  /** App-Language pair such as `app-1|en` */
  language: string;
  translationService: HsCustomTranslationService;
}

@Injectable({
  providedIn: 'root',
})
export class HsLanguageService {
  translateServiceFactory: any;
  apps: {
    [id: string]: HsLangageObject;
  } = {};
  constructor(
    @Inject(HsCustomTranslationService) translateServiceFactory: any,
    private HttpClient: HttpClient,
    private hsConfig: HsConfig
  ) {
    this.translateServiceFactory = translateServiceFactory;
  }

  /**
   * @public
   * @param lang - Language code without app prefix
   * Set language
   */
  setLanguage(lang: string, app: string): void {
    if (app == undefined) {
      app == 'default';
    }
    if (!lang.includes('|')) {
      lang = `${app}|${lang}`;
    }
    this.getTranslator(app).use(lang);
    this.apps[app].language = lang;
  }

  getTranslator(app): HsCustomTranslationService {
    if (this.apps[app] == undefined) {
      this.apps[app] = {
        language: app + '|' + DEFAULT_LANG,
        translationService: this.translateServiceFactory(
          this.hsConfig,
          this.HttpClient
        ),
      };
      this.apps[app].translationService.use(app + '|' + DEFAULT_LANG);
    }
    return this.apps[app].translationService;
  }

  /**
   * @public
   * @returns Returns language code
   * Get code of current language
   */
  getCurrentLanguageCode(app: string): string {
    if (
      typeof this.apps[app].language == 'undefined' ||
      this.apps[app].language == ''
    ) {
      return DEFAULT_LANG;
    }
    return this.apps[app].language.split('|').pop().substr(0, 2).toLowerCase();
  }

  /**
   * @public
   * @returns Returns available languages
   * Get array of available languages based
   */
  listAvailableLanguages(app: string): any {
    const language_code_name_map = {
      'en': 'English',
      'cs': 'Česky',
      'fr': 'Français',
      'lv': 'Latviski',
      'nl': 'Nederlands',
      'sk': 'Slovensky',
    };
    const langs = [{key: 'en', name: 'English'}];
    for (const lang of this.getTranslator(app)
      .getLangs()
      .map((l) => l.split('|')[1])) {
      if (
        language_code_name_map.hasOwnProperty(lang) &&
        langs.filter((l) => l.key == lang).length == 0
      ) {
        langs.push({key: lang, name: language_code_name_map[lang]});
      }
    }
    return langs;
  }

  /**
   * @param  str - Identifier of the string to be translated
   * @param params -
   * @returns Translation
   */
  getTranslation(str: string, params?: any, app?: string): string {
    if (app == undefined) {
      app = Object.keys(this.apps)[0];
    }
    return this.getTranslator(app).instant(str, params);
  }

  /**
   * Async variant of getTranslation function for translations which might
   * be needed immediately after application init before locales are even loaded
   */
  async awaitTranslation(
    str: string,
    params?: any,
    app?: string
  ): Promise<string> {
    if (app == undefined) {
      app = Object.keys(this.apps)[0];
    }
    return await lastValueFrom(this.getTranslator(app).get(str, params));
  }

  /**
   * @param module - Module to look for inside the locales json
   * @param text - Text that represents the translation
   * @param params - Dynamic params included in the translation, for example,
   * "translation": "This is my {{nr}} translation" - params: {nr: 'first'}
   * @returns Translation
   */

  getTranslationIgnoreNonExisting(
    module: string,
    text: string,
    params?: any,
    app?: string
  ): string {
    if (app == undefined) {
      app = Object.keys(this.apps)[0];
    }
    const tmp = this.getTranslation(
      module + '.' + text,
      params || undefined,
      app
    );
    if (tmp.includes(module + '.')) {
      return text;
    }
    return tmp;
  }
}
