import * as angular from 'angular';
import {HsHistoryListComponent} from './history-list.component';
import {HsHistoryListModule} from './history-list.module';
import {HsHistoryListService} from './history-list.service';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';
export const downgradedModule = downgrade(HsHistoryListModule);
angular
  .module(downgradedModule, [])
  /**
   * @memberof hs.addLayers
   * @ngdoc directive
   * @name compile
   * @description Directive which displays list of previously used urls or any other string
   */
  .directive(
    'hsHistoryList',
    downgradeComponent({component: HsHistoryListComponent})
  )
  /**
   * @memberof hs.addLayers
   * @ngdoc service
   * @name compile
   * @description Service which reads and writes list of previously used urls or any other string
   */
  .service('HsHistoryListService', downgradeInjectable(HsHistoryListService));

angular.module('hs.historyList', [downgradedModule]);
export {HsHistoryListModule} from './history-list.module';
