import mobile_settingsController from './mobile_settings.controller';
import mobile_settingsDirective from './mobile_settings.directive';

/**
 * @namespace hs.mobile_settings
 * @memberOf hs
 */

angular.module('hs.mobile_settings', ['hs.core'])
    /**
    * @memberof hs.mobile_settings
    * @ngdoc directive
    * @name hs.mobileSettings.directive
    * @description TODO
    */
    .directive('hs.mobileSettings.directive', mobile_settingsDirective)

    /**
    * @memberof hs.mobile_settings
    * @ngdoc controller
    * @name hs.mobile_settings.controller
    * @description TODO
    */
    .controller('hs.mobile_settings.controller', mobile_settingsController);

