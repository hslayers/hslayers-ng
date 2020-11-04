/* eslint-disable angular/file-name */
import * as angular from 'angular';
import {HsUiExtensionsModule} from './ui-extensions.module';
import {HsUiExtensionsRecursiveDd} from './recursive-dd.component';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsUiExtensionsModule);

angular
  .module(downgradedModule, [])
  .directive(
    'hsWidgetsRecursiveDd',
    downgradeComponent({component: HsUiExtensionsRecursiveDd})
  );

angular.module('hs.ui-extensions', [downgradedModule]);
export {HsUiExtensionsModule} from './ui-extensions.module';
