/**
 * @namespace hs.layout
 * @memberOf hs
 */
import angular from 'angular';
import core from 'core';
import '../map/map.module';
import geolocation from 'geolocation';
import layermanager from '../layermanager/layermanager.module';
import mdSidenavDirective from './md-sidenav.directive';
import mdRightPanelDirective from './md-right-panel.directive';
import mdBottomsheetScrollDirective from './md-bottomsheet-scroll.directive';
import layoutController from './layout.controller';
import layoutDirective from './layout.directive';
import panelCreatorDirective from './panel-creator.directive';
import mdToolbarDirective from './md-toolbar.directive';
import mdOverlayDirective from './md-overlay.directive';
import mdSwipeAreaDirective from './md-swipe-area.directive';
import layoutService from './layout.service';
import layoutPanelHeaderDirective from './layout-panel-header.directive';

// 'material.components.bottomSheetCollapsible'
angular.module('hs.layout', ['hs.core', 'hs.map', 'hs.geolocation', 'hs.layermanager', 'hs.print'])

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
    .controller('hs.layout.controller', layoutController)

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
    * @name hs.layout.service
    * @description TODO
    */
    .service('hs.layout.service', layoutService);
