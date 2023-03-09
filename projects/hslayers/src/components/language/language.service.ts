import {Injectable} from '@angular/core';
import {lastValueFrom} from 'rxjs';

import {
  CustomTranslationService,
  WebpackTranslateLoader,
} from './custom-translate.service';
import {HsConfig} from '../../config.service';

const DEFAULT_LANG = 'en' as const;

@Injectable({
  providedIn: 'root',
})
export class HsLanguageService {
  language: string;
  translateServiceFactory: any;
  id: number;
  constructor(
    private translationService: CustomTranslationService,
    private hsConfig: HsConfig
  ) {
    this.id = Math.random();
    this.hsConfig.configChanges.subscribe(() => {
      if (this.hsConfig.translationOverrides != undefined) {
        const translator = this.translationService;
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
  setLanguage(lang: string): void {
    if (lang.includes('|')) {
      lang = lang.split('|')[1];
    }
    this.translationService.use(lang);
    this.language = lang;
  }

  getTranslator(): CustomTranslationService {
    return this.translationService;
  }

  /**
   * @public
   * @returns Returns language code
   * Get code of current language
   */
  getCurrentLanguageCode(): string {
    if (typeof this.language == 'undefined' || this.language == '') {
      return DEFAULT_LANG;
    }
    return this.language.toLowerCase();
  }

  /**
   * @public
   * @returns Returns available languages
   * Get array of available languages based
   */
  listAvailableLanguages(): any {
    const languageCodeNameMap = {
      'en': 'English',
      'cs': 'Česky',
      'fr': 'Français',
      'lv': 'Latviski',
      'nl': 'Nederlands',
      'sk': 'Slovensky',
    };
    const langs = [{key: 'en', name: 'English'}];
    for (const lang of this.translationService.getLangs()) {
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
  getTranslation(str: string, params?: any): string {
    return this.translationService.instant(str, params);
  }

  /**
   * Async variant of getTranslation function for translations which might
   * be needed immediately after application init before locales are even loaded
   */
  async awaitTranslation(str: string, params?: any): Promise<string> {
    const translator = this.translationService;
    const lang = translator.currentLang;
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
    params?: any
  ): string {
    const tmp = this.getTranslation(module + '.' + text, params || undefined);
    if (tmp.includes(module + '.')) {
      return text;
    }
    return tmp;
  }
}
