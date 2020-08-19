import '../core/';
import * as angular from 'angular';

import {HsToolbarComponent} from './toolbar.component';
import {HsToolbarModule} from './toolbar.module';

import {downgrade} from '../../common/downgrader';
import {downgradeComponent} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsToolbarModule);

/**
 * @namespace hs.toolbar
 * @memberOf hs
 */
angular
  .module(downgradedModule, [])
  .directive('hs.toolbar', downgradeComponent({component: HsToolbarComponent}));

angular.module('hs.toolbar', [downgradedModule]);
export {HsToolbarModule} from './toolbar.module';
