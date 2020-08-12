import '../compositions/compositions.module';
import '../language/language.module';
import * as angular from 'angular';
import {HsShareComponent} from './share.component';
import {HsShareModule} from './share.module';
import {HsShareService} from './share.service';
import {HsShareUrlService} from './share-url.service';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsShareModule);

/**
 * @namespace hs.permalink
 * @memberOf hs
 */

angular
  .module(downgradedModule, [
    '720kb.socialshare',
    'hs.core',
    'hs.map',
    'hs.save-map',
    'hs.compositions',
    'hs.language',
  ])

  .config(($locationProvider) => {
    'ngInject';
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false,
    });
  })

  /**
   * @ngdoc service
   * @name HsPermalinkUrlService
   * @membeof hs.permalink
   * @description Service responsible for creating permalink URLs. Mantain parameters information about map
   */
  .service('HsPermalinkUrlService', downgradeInjectable(HsShareUrlService))

  /**
   * @ngdoc service
   * @name HsPermalinkShareService
   * @membeof hs.permalink
   * @description Service responsible for sharing background. Mantain correct sharing links on the fly
   */
  .service('HsPermalinkShareService', downgradeInjectable(HsShareService))

  /**
   * @name hs.permalink
   * @membeof hs.permalink
   * @description
   */
  .directive('hsShare', downgradeComponent({component: HsShareComponent}));

angular.module('hs.permalink', [downgradedModule]);
export {HsShareModule} from './share.module';
