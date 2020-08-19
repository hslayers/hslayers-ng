import {HsLayoutModule} from './layout.module';
import {downgrade} from '../../common/downgrader';
export const downgradedLayoutModule = downgrade(HsLayoutModule);
import '../core/';
import '../geolocation/geolocation.module';
import '../layermanager/';
import '../map/map.module';
import * as angular from 'angular';
import layoutController from './layout.controller';
import layoutDirective from './layout.directive';
import mdBottomsheetScrollDirective from './md-bottomsheet-scroll.directive';
import mdOverlayDirective from './md-overlay.directive';
import mdRightPanelDirective from './md-right-panel.directive';
import mdSidenavDirective from './md-sidenav.directive';
import mdSwipeAreaDirective from './md-swipe-area.directive';
import mdToolbarDirective from './md-toolbar.directive';
import panelCreatorDirective from './panel-creator.directive';
import {HsDialogContainerComponent} from './dialogs/dialog-container.component';
import {HsDialogContainerService} from './dialogs/dialog-container.service';
import {HsLayoutService} from './layout.service';
import {HsPanelHeaderComponent} from './layout-panel-header.component';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

/**
 * @namespace hs.layout
 * @memberOf hs
 */
angular
  .module(downgradedLayoutModule, [
    'hs.core',
    'hs.map',
    'hs.geolocation',
    'hs.layermanager',
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
  .directive(
    'hsPanelHeader',
    downgradeComponent({component: HsPanelHeaderComponent})
  )

  .directive(
    'hsDialogContainer',
    downgradeComponent({component: HsDialogContainerComponent})
  )

  .service(
    'HsDialogContainerService',
    downgradeInjectable(HsDialogContainerService)
  )

  /**
   * @memberof hs.layout
   * @ngdoc service
   * @name HsLayoutService
   * @description TODO
   */
  .service('HsLayoutService', HsLayoutService);

angular.module('hs.layout', [downgradedLayoutModule]);

export {HsLayoutModule} from './layout.module';
