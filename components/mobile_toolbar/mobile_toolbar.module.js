import '../map/map.module';
import mobileToolbarService from './mobile-toolbar.service';
import mobileToolbarDirective from './mobile-toolbar.directive';
import mobileToolbarController from './mobile-toolbar.controller';

/**
 * @namespace hs.mobile_toolbar
 * @memberOf hs
 */
angular.module('hs.mobile_toolbar', ['hs.map', 'hs.core', 'hs.layout'])
    /**
    * @memberof hs.mobile_toolbar
    * @ngdoc service
    * @name hs.mobile_toolbar.service
    * @description TODO
    */
    .service('hs.mobile_toolbar.service', mobileToolbarService)
    
    /**
    * @memberof hs.mobile_toolbar
    * @ngdoc directive
    * @name hs.mobile_toolbar.directive
    * @description TODO
    */
    .directive('hs.mobileToolbar.directive', mobileToolbarDirective)

    /**
    * @memberof hs.mobile_toolbar
    * @ngdoc controller
    * @name hs.mobile_toolbar.controller
    * @description TODO
    */
    .controller('hs.mobile_toolbar.controller', mobileToolbarController);
