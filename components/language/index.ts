import * as angular from 'angular';
import {HsLanguageComponent} from './language.component';
import {HsLanguageModule} from './language.module';
import {HsLanguageService} from './language.service';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsLanguageModule);
/**
 * @namespace hs.language
 * @memberOf hs
 * @param service
 */
angular
  .module(downgradedModule, [])
  /**
   * @memberof hs.language
   * @ngdoc directive
   * @name hs.language.directive
   * @description Add print dialog template to the app
   */
  .directive('hsLanguage', downgradeComponent({component: HsLanguageComponent}))

  /**
   * @memberof hs.language
   * @ngdoc service
   * @name HsLanguageService
   */
  .service('HsLanguageService', downgradeInjectable(HsLanguageService));

angular.module('hs.language', [downgradedModule]);
export {HsLanguageModule} from './language.module';
