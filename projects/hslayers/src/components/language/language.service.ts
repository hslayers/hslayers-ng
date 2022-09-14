import {HttpClient} from '@angular/common/http';
import {Inject, Injectable} from '@angular/core';
import {lastValueFrom} from 'rxjs';

import {HsConfig} from '../../config.service';
import {
  CustomTranslationService as HsCustomTranslationService,
  WebpackTranslateLoader,
} from './custom-translate.service';

const DEFAULT_LANG = 'en' as const;

class HsLanguageObject {
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
    [id: string]: HsLanguageObject;
  } = {};

  constructor(
    @Inject(HsCustomTranslationService) translateServiceFactory: any,
    private HttpClient: HttpClient,
    private hsConfig: HsConfig
  ) {
    this.translateServiceFactory = translateServiceFactory;
    this.hsConfig.configChanges.subscribe(({app, config}) => {
      if (config.translationOverrides != undefined) {
        const translator = this.getTranslator(app);
        if (translator?.currentLang) {
          translator.reloadLang(translator.currentLang);
        }
      }
    });
  }

  /**
   * @public
   * @param lang - Language code without app prefix
   * Set language
   */
  setLanguage(lang: string, app: string = 'default'): void {
    if (!lang.includes('|')) {
      lang = `${app}|${lang}`;
    }
    this.getTranslator(app).use(lang);
    this.apps[app].language = lang;
  }

  getTranslator(app: string): HsCustomTranslationService {
    if (this.apps[app] == undefined) {
      this.apps[app] = {
        language: app + '|' + DEFAULT_LANG,
        translationService: this.translateServiceFactory(
          this.hsConfig,
          this.HttpClient
        ),
      };
    }
    return this.apps[app].translationService;
  }

  /**
   * @public
   * @returns Returns language code
   * Get code of current language
   */
  getCurrentLanguageCode(app: string = 'default'): string {
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
  listAvailableLanguages(app: string = 'default'): any {
    const languageCodeNameMap = {
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
        languageCodeNameMap.hasOwnProperty(lang) &&
        langs.filter((l) => l.key == lang).length == 0
      ) {
        langs.push({key: lang, name: languageCodeNameMap[lang]});
      }
    }
    return langs;
  }

  /**
   * @param  str - Identifier of the string to be translated
   * @param params -
   * @returns Translation
   */
  getTranslation(str: string, params?: any, app: string = 'default'): string {
    return this.getTranslator(app).instant(str, params);
  }

  /**
   * Async variant of getTranslation function for translations which might
   * be needed immediately after application init before locales are even loaded
   */
  async awaitTranslation(
    str: string,
    params?: any,
    app: string = 'default'
  ): Promise<string> {
    const translator = this.getTranslator(app);
    const lang = translator.currentLang.includes('|')
      ? translator.currentLang.split('|')[1]
      : translator.currentLang;
    const MAX_CONFIG_POLLS = 10;
    let counter = 0;
    while (
      !(translator.currentLoader as WebpackTranslateLoader).loaded[lang] &&
      counter++ < MAX_CONFIG_POLLS
    ) {
      await new Promise((resolve2) => setTimeout(resolve2, 500));
    }
    const value = await lastValueFrom(translator.get(str, params));
    return value;
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
    app: string = 'default'
  ): string {
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
