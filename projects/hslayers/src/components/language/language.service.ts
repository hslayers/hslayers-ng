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
      const translator = this.getTranslator(app);
      if (config.enabledLanguages) {
        const langs = config.enabledLanguages.split(',');
        const langsToAdd = langs.filter(
          (l) => !translator.getLangs().includes(l)
        );
        translator.addLangs(langsToAdd.map((l) => `${app}|${l}`));
      }
      if (config.language) {
        this.setLanguage(config.language, app);
      }
      if (config.translationOverrides != undefined) {
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
  setLanguage(lang: string, app = 'default', retryCount = 0): void {
    if (!lang.includes('|')) {
      lang = `${app}|${lang}`;
    }
    this.getTranslator(app).use(lang);

    if (this.getTranslator(app).currentLang !== lang) {
      if (retryCount < 5) {
        console.warn(
          `Setting language to: ${lang} failed. Retrying (${
            retryCount + 1
          }/5) after a short while.`
        );
        setTimeout(() => {
          this.setLanguage(lang, app, retryCount + 1); // Increase retry count
        }, 150);
      } else {
        console.error(`Setting language to: ${lang} failed after 5 attempts.`);
      }
    }

    this.apps[app].language = lang;
  }

  getTranslator(app: string): HsCustomTranslationService {
    if (this.apps[app] == undefined) {
      let translationService;
      if (typeof this.translateServiceFactory == 'object') {
        translationService = this.translateServiceFactory;
      } else if (typeof this.translateServiceFactory == 'function') {
        translationService = this.translateServiceFactory(
          this.hsConfig,
          this.HttpClient
        );
      }
      this.apps[app] = {
        language: app + '|' + DEFAULT_LANG,
        translationService,
      };
    }
    return this.apps[app].translationService;
  }

  /**
   * @public
   * @returns Returns language code
   * Get code of current language
   */
  getCurrentLanguageCode(app = 'default'): string {
    if (
      typeof this.apps[app].language == 'undefined' ||
      this.apps[app].language == ''
    ) {
      return DEFAULT_LANG;
    }
    return this.apps[app].language.split('|').pop().substr(0, 2).toLowerCase();
  }

  /**
   * @returns Returns available languages
   * Get array of available languages based
   */
  listAvailableLanguages(app = 'default'): {key: string; name: string}[] {
    const additionalLanguages = this.hsConfig.get(app).additionalLanguages;
    const languageCodeNameMap = {
      ...{
        en: 'English',
        cs: 'Česky',
        fr: 'Français',
        lv: 'Latviski',
        nl: 'Nederlands',
        sk: 'Slovensky',
      },
      ...additionalLanguages,
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
  getTranslation(str: string, params?: any, app = 'default'): string {
    return this.getTranslator(app).instant(str, params);
  }

  /**
   * Async variant of getTranslation function for translations which might
   * be needed immediately after application init before locales are even loaded
   */
  async awaitTranslation(
    str: string,
    params?: any,
    app = 'default'
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
    app = 'default'
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
