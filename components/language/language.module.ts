import * as angular from 'angular';
import HsLanguageService from './language.service';
import HsLanguageController from './language.controller';
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
  .directive('hs.language.directive', () => {
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
  .factory('HsLanguageService', HsLanguageService)

  /**
   * @memberof hs.language
   * @ngdoc controller
   * @name HsLanguageController
   */
  .controller('HsLanguageController', HsLanguageController);
