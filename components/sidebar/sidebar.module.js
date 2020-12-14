import '../core/core.module';
import '../map/map.module';
import '../permalink/permalink.module';
import 'angular-cookies';
import impressumComponent from './impressum.component';
import sidebarController from './sidebar.controller';
import sidebarDirective from './sidebar.directive';
import sidebarMiniDirective from './sidebar-mini.directive';
import sidebarService from './sidebar.service';

/**
 * @namespace hs.sidebar
 * @memberOf hs
 */
angular
  .module('hs.sidebar', ['hs.map', 'hs.core', 'ngCookies', 'hs.layout'])
  /**
   * @memberof hs.sidebar
   * @ngdoc service
   * @name HsSidebarService
   * @description TODO
   */
  .factory('HsSidebarService', sidebarService)

  /**
   * @memberof hs.sidebar
   * @ngdoc directive
   * @name hs.sidebar.directive
   * @description Add sidebar template to app, listeners for sidebar width changes are embed in directive
   */
  .directive('hs.sidebar.directive', sidebarDirective)

  /**
   * @memberof hs.sidebar
   * @ngdoc directive
   * @name hs.sidebar.directive
   * @description Add sidebar template to app, listeners for sidebar width changes are embed in directive
   */
  .directive('hs.minisidebar.directive', sidebarMiniDirective)

  /**
   * @memberof hs.sidebar
   * @ngdoc controller
   * @name HsSidebarController
   */
  .controller('HsSidebarController', sidebarController)

  /**
   * @memberof hs.sidebar
   * @ngdoc component
   * @name hs.impressum
   * @description Sidebar component which displays logo and version
   */
  .component('hs.impressum', impressumComponent);
