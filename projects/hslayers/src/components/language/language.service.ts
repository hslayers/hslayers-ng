import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class HsLanguageService {
  language: string;
  constructor(private TranslateService: TranslateService) {}

  /**
   * @public
   * @param {string} lang Language code
   * @description Set language
   */
  setLanguage(lang: string): void {
    this.language = lang;
    this.TranslateService.use(lang);
    // this.HsEventBusService.updateLanguageButton.next({
    //   language: lang,
    // });
  }

  /**
   * @public
   * @returns {string} Returns language code
   * @description Get code of current language
   */
  getCurrentLanguageCode(): string {
    if (typeof this.language == 'undefined' || this.language == '') {
      return 'en';
    }
    return this.language.substr(0, 2).toLowerCase();
  }

  /**
   * @public
   * @returns {Object} Returns available languages
   * @description Get array of available languages based
   */
  listAvailableLanguages(): any {
    const language_code_name_map = {
      'en': 'English',
      'cs': 'Česky',
      'fr': 'Français',
      'lv': 'Latviski',
      'nl': 'Nederlands',
      'sk': 'Slovensky',
    };
    const langs = [{key: 'en', name: 'English'}];
    for (const lang of this.TranslateService.getLangs()) {
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
  getTranslation(str: string, params?: any): string {
    return this.TranslateService.instant(str, params);
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
