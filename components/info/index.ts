import '../core/';
import * as angular from 'angular';
import {HsInfoComponent} from './info.component';
import {HsInfoModule} from './info.module';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsInfoModule);
/**
 * @ngdoc module
 * @module hs.info
 * @name hs.info
 * @description Module responsible for info application status information window. Contain HS-Layers default info template and its controller. When included, it also updates webpage meta tags with current map information.
 */
angular
  .module(downgradedModule, ['hs.core'])
  /**
   * @module info
   * @name hs.info
   * @ngdoc component
   * @description Automatically updates composition abstract and status when composition is changed through appropriete composition / layermanager events. Shows mainly current composition status. Also display loading sign when composition is loading.
   */
  .directive('hsInfo', downgradeComponent({component: HsInfoComponent}));

angular.module('hs.info', [downgradedModule]);
export {HsInfoModule} from './info.module';
