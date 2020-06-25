/**
 * @param $scope
 * @param HsLanguageService
 */
export default function ($scope, HsLanguageService) {
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
}
