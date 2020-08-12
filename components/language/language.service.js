/**
 * @param gettextCatalog
 */
export class HsLanguageService {
  constructor(gettextCatalog) {
    'ngInject';
    this.gettextCatalog = gettextCatalog;
  }

  /**
   * @memberof HsLanguageService
   * @function setlanguage
   * @public
   * @params {string} lang
   * @description Set language
   * @param lang
   */
  setLanguage(lang) {
    this.language = lang;
    switch (lang) {
      case 'cs_CZ':
        lang = 'cs';
        break;
      case 'nl_BE':
        lang = 'nl';
        break;
      default:
        return;
    }
    this.gettextCatalog.setCurrentLanguage(lang);
  }

  /**
   * @ngdoc method
   * @name HsCore#getCurrentLanguagePrefix
   * @public
   * @description Get code of current language
   */
  getCurrentLanguageCode() {
    if (typeof this.language == 'undefined' || this.language == '') {
      return 'en';
    }
    return this.language.substr(0, 2).toLowerCase();
  }

  /**
   * @ngdoc method
   * @name HsCore#listAvailableLanguages
   * @public
   * @description Get array of available languages based on translations.js
   * or translations_extended.js files which have gettextCatalog services in them
   */
  listAvailableLanguages() {
    const language_code_name_map = {
      'en': 'English',
      'cs': 'Český',
      'fr_FR': 'Français',
      'lv_LV': 'Latviski',
      'nl': 'Nederlands',
    };
    const langs = [{key: 'en', name: 'English'}];
    for (const key in this.gettextCatalog.strings) {
      if (this.gettextCatalog.strings.hasOwnProperty(key)) {
        langs.push({key: key, name: language_code_name_map[key]});
      }
    }
    return langs;
  }
}
