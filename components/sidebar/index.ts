/* eslint-disable angular/file-name */
import '../layout';
import '../permalink/';
import * as angular from 'angular';
import {HsMiniSidebarComponent} from './mini-sidebar.component';
import {HsSidebarComponent} from './sidebar.component';
import {HsSidebarModule} from './sidebar.module';
import {HsSidebarService} from './sidebar.service';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsSidebarModule);

/**
 * @namespace hs.sidebar  * @memberOf hs
 */
angular
  .module(downgradedModule, ['hs.map'])
  .service('HsSidebarService', downgradeInjectable(HsSidebarService))
  .directive('hsSidebar', downgradeComponent({component: HsSidebarComponent}))
  .directive(
    'hsMiniSidebar',
    downgradeComponent({component: HsMiniSidebarComponent})
  );

angular.module('hs.sidebar', [downgradedModule]);
export {HsSidebarModule} from './sidebar.module';
