import '../map/map.module';
import '../permalink/permalink.module';
import 'angular-cookies';
import 'core';
import sidebarService from './sidebar.service';
import sidebarMiniDirective from './sidebar-mini.directive';
import sidebarDirective from './sidebar.directive';
import sidebarController from './sidebar.controller';

/**
 * @namespace hs.sidebar
 * @memberOf hs
 */
angular.module('hs.sidebar', ['hs.map', 'hs.core', 'ngCookies', 'hs.layout'])
    /**
     * @memberof hs.sidebar
     * @ngdoc service
     * @name hs.sidebar.service
     * @description TODO
     */
    .service('hs.sidebar.service', sidebarService)

    /**
     * @memberof hs.sidebar
     * @ngdoc directive
     * @name hs.sidebar.directive
     * @description Add sidebar template to app, listeners for sidebar width changes are embed in directive
     */
    .directive('hs.sidebar.directive', sidebarDirective )

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
     * @name hs.sidebar.controller
     */
    .controller('hs.sidebar.controller', sidebarController);
