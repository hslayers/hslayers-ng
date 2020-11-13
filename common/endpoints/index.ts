/* eslint-disable angular/file-name */
import * as angular from 'angular';
import {HsCommonEndpointsModule} from './endpoints.module';
import {HsCommonEndpointsService} from './endpoints.service';
import {downgrade} from '../../common/downgrader';
import {downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsCommonEndpointsModule);

angular
  .module(downgradedModule, [])
  .service(
    'HsCommonEndpointsService',
    downgradeInjectable(HsCommonEndpointsService)
  );

angular.module('hs.common.endpoints', [downgradedModule]);
export {HsCommonEndpointsModule} from './endpoints.module';
