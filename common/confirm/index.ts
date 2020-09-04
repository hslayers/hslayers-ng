import * as angular from 'angular';
import {HsConfirmDialogComponent} from './confirm-dialog.component';
import {HsConfirmModule} from './confirm.module';
import {downgrade} from '../downgrader';
import {downgradeComponent} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsConfirmModule);
angular
  .module(downgradedModule, [])
  .directive(
    'hsConfirmDialogComponent',
    downgradeComponent({component: HsConfirmDialogComponent})
  );

angular.module('hs.common.confirm', [downgradedModule]);

export {HsConfirmModule} from './confirm.module';
