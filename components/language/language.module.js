/* eslint-disable angular/di */
/**
 * @namespace hs.print
 * @memberOf hs
 * @param HsCore
 * @param gettextCatalog
 * @param $scope
 * @param service
 * @param config
 */
export default angular
  .module('hs.language', [])
  /**
   * @memberof hs.language
   * @ngdoc directive
   * @name hs.language.directive
   * @description Add print dialog template to the app
   */
  .directive('hs.language.directive', (HsConfig) => {
    'ngInject';
    return {
      template: require(`components/language/partials/language.html`),
    };
  })

  /**
   * @memberof hs.language
   * @ngdoc service
   * @name HsLanguageService
   */
  .factory('HsLanguageService', (gettextCatalog) => {
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
  })

  /**
   * @memberof hs.language
   * @ngdoc controller
   * @name HsLanguageController
   */
  .controller('HsLanguageController', ($scope, HsLanguageService) => {
    'ngInject';
    /**
     * Set language
     *
     * @memberof HsLanguageController
     * @function setLanguage
     * @param {string} lang
     */
    $scope.setLanguage = function (lang) {
      HsLanguageService.setLanguage(lang);
    };

    $scope.getCurrentLanguageCode = HsLanguageService.getCurrentLanguageCode;
    $scope.available_languages = HsLanguageService.listAvailableLanguages();

    $scope.$emit('scope_loaded', 'Language');
  });
