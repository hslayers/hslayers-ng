import * as angular from 'angular';
import {HsPrintComponent} from './print.component';
import {HsPrintModule} from './print.module';
import {HsPrintService} from './print.service';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedPrintModule = downgrade(HsPrintModule);

angular
  .module(downgradedPrintModule, [])

  .directive('hs.print', downgradeComponent({component: HsPrintComponent}))
  /**
   * @memberof hs.print
   * @ngdoc service
   * @name HsPrintService
   */
  .factory('HsPrintService', downgradeInjectable(HsPrintService));

angular.module('hs.print', [downgradedPrintModule]);

export * from './print.service';
export {HsPrintModule} from './print.module';
