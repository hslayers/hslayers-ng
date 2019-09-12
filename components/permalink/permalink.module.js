import 'components/compositions/compositions.module';
import permalinkUrlService from './permalink-url.service';
import permalinkShareService from './permalink-share.service';
import permalinkComponent from './permalink.component';
import 'language.module';

/**
 * @namespace hs.permalink
 * @memberOf hs
 */

var module = angular.module('hs.permalink', ['720kb.socialshare', 'hs.core', 'hs.map', 'hs.save-map', 'hs.compositions', 'hs.language']);

module.config(['$locationProvider', function ($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
}]);

/**
 * @ngdoc service
 * @name hs.permalink.urlService
 * @membeof hs.permalink
 * @description Service responsible for creating permalink URLs. Mantain parameters information about map
 */
module.service("hs.permalink.urlService", permalinkUrlService);

/**
 * @ngdoc service
 * @name hs.permalink.shareService
 * @membeof hs.permalink
 * @description Service responsible for sharing background. Mantain correct sharing links on the fly
 */
module.service('hs.permalink.shareService', permalinkShareService);


/**
 * @name hs.permalink
 * @membeof hs.permalink
 * @description 
 */
module.component('hs.permalink', permalinkComponent);
