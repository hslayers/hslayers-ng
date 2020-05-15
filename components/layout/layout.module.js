import '../core/core.module';
import '../geolocation/geolocation';
import '../layermanager/layermanager.module';
import '../map/map.module';
import '../print/print.module';
import angular from 'angular';
import layoutController from './layout.controller';
import layoutDirective from './layout.directive';
import layoutPanelHeaderDirective from './layout-panel-header.directive';
import layoutService from './layout.service';
import mdBottomsheetScrollDirective from './md-bottomsheet-scroll.directive';
import mdOverlayDirective from './md-overlay.directive';
import mdRightPanelDirective from './md-right-panel.directive';
import mdSidenavDirective from './md-sidenav.directive';
import mdSwipeAreaDirective from './md-swipe-area.directive';
import mdToolbarDirective from './md-toolbar.directive';
import panelCreatorDirective from './panel-creator.directive';
/**
 * @namespace hs.layout
 * @memberOf hs
 */
angular
  .module('hs.layout', [
    'hs.core',
    'hs.map',
    'hs.geolocation',
    'hs.layermanager',
    'hs.print',
  ]) // 'material.components.bottomSheetCollapsible'
  /**
   * @memberof hs.layout
   * @ngdoc directive
   * @name hs.layout.directive
   * @description TODO
   */
  .directive('hs.layout.directive', layoutDirective)

  /**
   * @memberof hs.mdLayout
   * @ngdoc directive
   * @name hs.mdSidenav.directive
   * @description TODO
   */
  .directive('hs.mdSidenav.directive', mdSidenavDirective)

  /**
   * @memberof hs.mdLayout
   * @ngdoc directive
   * @name hs.mdRightPanel.directive
   * @description TODO
   */
  .directive('hs.mdRightPanel.directive', mdRightPanelDirective)

  /**
   * @memberof hs.mdLayout
   * @ngdoc directive
   * @name hs.mdToolbar.directive
   * @description TODO
   */
  .directive('hs.mdToolbar.directive', mdToolbarDirective)

  /**
   * @memberof hs.mdLayout
   * @ngdoc directive
   * @name hs.mdOverlay.directive
   * @description TODO
   */
  .directive('hs.mdOverlay.directive', mdOverlayDirective)

  /**
   * @memberof hs.mdLayout
   * @ngdoc directive
   * @name hs.swipeArea.directive
   * @description TODO
   */
  .directive('hs.swipeArea.directive', mdSwipeAreaDirective)

  /**
   * @memberof hs.mdLayout
   * @ngdoc directive
   * @name hs.bottomSheetScroll
   * @description TODO
   */
  .directive('hs.bottomSheetScroll', mdBottomsheetScrollDirective)

  /**
   * @memberof hs.layout
   * @ngdoc component
   * @name hs.layout
   * @description TODO
   */
  .controller('HsLayoutController', layoutController)

  /**
   * @memberof hs.layout
   * @ngdoc directive
   * @name hs.panelCreator
   * @description TODO
   */
  .directive('panelCreator', panelCreatorDirective)

  /**
   * @memberof hs.layout
   * @ngdoc directive
   * @name hs.panelHeader
   * @description Directive for title bar of panels
   */
  .directive('hs.layout.panelHeader', layoutPanelHeaderDirective)

  /**
   * @memberof hs.layout
   * @ngdoc service
   * @name HsLayoutService
   * @description TODO
   */
  .factory('HsLayoutService', layoutService);
