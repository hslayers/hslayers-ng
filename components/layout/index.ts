import {HsLayoutModule} from './layout.module';
import {downgrade} from '../../common/downgrader';
export const downgradedLayoutModule = downgrade(HsLayoutModule);
import * as angular from 'angular';
import {HsDialogContainerComponent} from './dialogs/dialog-container.component';
import {HsDialogContainerService} from './dialogs/dialog-container.service';
import {HsLayoutComponent} from './layout.component';
import {HsLayoutService} from './layout.service';
import {HsPanelContainerComponent} from './panels/panel-container.component';
import {HsPanelContainerService} from './panels/panel-container.service';
import {HsPanelHeaderComponent} from './panels/layout-panel-header.component';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';
/**
 * @namespace hs.layout
 * @memberOf hs
 */
angular
  .module(downgradedLayoutModule, []) // 'material.components.bottomSheetCollapsible'
  /**
   * @memberof hs.layout
   * @ngdoc directive
   * @name hs.layout.directive
   * @description TODO
   */
  .directive(
    'hsLayout',
    downgradeComponent({component: HsLayoutComponent})
  )

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
    'hsPanelContainer',
    downgradeComponent({component: HsPanelContainerComponent})
  )

  .directive(
    'hsDialogContainer',
    downgradeComponent({component: HsDialogContainerComponent})
  )

  .service(
    'HsDialogContainerService',
    downgradeInjectable(HsDialogContainerService)
  )

  .service(
    'HsPanelContainerService',
    downgradeInjectable(HsPanelContainerService)
  )

  /**
   * @memberof hs.layout
   * @ngdoc service
   * @name HsLayoutService
   * @description TODO
   */
  .service('HsLayoutService', downgradeInjectable(HsLayoutService));

angular.module('hs.layout', [downgradedLayoutModule]);

export {HsLayoutModule} from './layout.module';
