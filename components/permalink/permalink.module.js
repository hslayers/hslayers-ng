import '../compositions/compositions.module';
import permalinkUrlService from './permalink-url.service';
import permalinkShareService from './permalink-share.service';
import permalinkComponent from './permalink.component';
import '../language/language.module';

/**
 * @namespace hs.permalink
 * @memberOf hs
 */

angular.module('hs.permalink', ['720kb.socialshare', 'hs.core', 'hs.map', 'hs.save-map', 'hs.compositions', 'hs.language'])

  .config(['$locationProvider', function ($locationProvider) {
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
  }])

/**
 * @ngdoc service
 * @name hs.permalink.urlService
 * @membeof hs.permalink
 * @description Service responsible for creating permalink URLs. Mantain parameters information about map
 */
  .factory('hs.permalink.urlService', permalinkUrlService)

/**
 * @ngdoc service
 * @name hs.permalink.shareService
 * @membeof hs.permalink
 * @description Service responsible for sharing background. Mantain correct sharing links on the fly
 */
  .factory('hs.permalink.shareService', permalinkShareService)


/**
 * @name hs.permalink
 * @membeof hs.permalink
 * @description
 */
  .component('hs.permalink', permalinkComponent);
