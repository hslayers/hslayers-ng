import '../core/core.module';
import '../map/map.module';
import '../permalink/permalink.module';
import 'angular-cookies';
import sidebarController from './sidebar.controller';
import sidebarDirective from './sidebar.directive';
import sidebarMiniDirective from './sidebar-mini.directive';
import sidebarService from './sidebar.service';
import * as angular from "angular";

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
  .controller('HsSidebarController', sidebarController);
