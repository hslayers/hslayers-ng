/**
 * @param gettextCatalog
 */
export default function (gettextCatalog) {
  'ngInject';
  const me = {};
  /**
   * @memberof HsLanguageService
   * @function setlanguage
   * @public
   * @params {String} lang
   * @description Set language
   * @param lang
   */
  me.setLanguage = function (lang) {
    me.language = lang;
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
    gettextCatalog.setCurrentLanguage(lang);
  };

  /**
   * @ngdoc method
   * @name HsCore#getCurrentLanguagePrefix
   * @public
   * @description Get code of current language
   */
  me.getCurrentLanguageCode = function () {
    if (typeof me.language == 'undefined' || me.language == '') {
      return 'en';
    }
    return me.language.substr(0, 2).toLowerCase();
  };

  /**
   * @ngdoc method
   * @name HsCore#listAvailableLanguages
   * @public
   * @description Get array of available languages based on translations.js
   * or translations_extended.js files which have gettextCatalog services in them
   */
  me.listAvailableLanguages = function () {
    const language_code_name_map = {
      'en': 'English',
      'cs': 'Český',
      'fr_FR': 'Français',
      'lv_LV': 'Latviski',
      'nl': 'Nederlands',
    };
    const langs = [{key: 'en', name: 'English'}];
    for (const key in gettextCatalog.strings) {
      if (gettextCatalog.strings.hasOwnProperty(key)) {
        langs.push({key: key, name: language_code_name_map[key]});
      }
    }
    return langs;
  };

  return me;
}
