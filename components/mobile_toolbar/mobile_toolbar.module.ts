import '../map/map.module';
import mobileToolbarController from './mobile-toolbar.controller';
import mobileToolbarDirective from './mobile-toolbar.directive';
import mobileToolbarService from './mobile-toolbar.service';
import * as angular from "angular";
import {downgradedLayoutModule} from '../layout';
/**
 * @namespace hs.mobile_toolbar
 * @memberOf hs
 */
angular
  .module('hs.mobile_toolbar', ['hs.map', 'hs.core', downgradedLayoutModule])
  /**
   * @memberof hs.mobile_toolbar
   * @ngdoc service
   * @name HsMobileToolbarService
   * @description TODO
   */
  .factory('HsMobileToolbarService', mobileToolbarService)

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
   * @name HsMobileToolbarController
   * @description TODO
   */
  .controller('HsMobileToolbarController', mobileToolbarController);
