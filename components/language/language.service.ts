import {HsEventBusService} from './../core/event-bus.service';
import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
@Injectable({
  providedIn: 'root',
})
export class HsLanguageService {
  language: string;
  constructor(private TranslateService: TranslateService) {
    this.getCurrentLanguageCode();
  }

  /**
   * @memberof HsLanguageService
   * @function setlanguage
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
   * @function method
   * @name HsLanguageService#getCurrentLanguagePrefix
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
   * @function listAvailableLanguages
   * @memberof HsLanguageService
   * @public
   * @returns {Object} Returns available languages
   * @description Get array of available languages based
   */
  listAvailableLanguages(): any {
    const language_code_name_map = {
      'en': 'English',
      'cs': 'Český',
      'fr': 'Français',
      'lv': 'Latviski',
      'nl': 'Nederlands',
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
   * @param {string} str  Identifier of the string to be translated
   * @param params
   * @returns {string} Translation
   */
  getTranslation(str: string, params?: any): string {
    return this.TranslateService.instant(str, params);
  }

  getTranslationIgnoreNonExisting(module: string, text: string): string {
    const tmp = this.getTranslation(module + '.' + text);
    if (tmp.includes(module + '.')) {
      return text;
    }
    return tmp;
  }
}
