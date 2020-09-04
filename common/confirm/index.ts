import * as angular from 'angular';
import {HsConfirmDialogComponent} from './confirm-dialog.component';
import {HsConfirmDialogService} from './confirm-dialog.service';
import {HsConfirmModule} from './confirm.module';
import {downgrade} from '../downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsConfirmModule);
angular
  .module(downgradedModule, [])
  .service(
    'HsConfirmDialogService',
    downgradeInjectable(HsConfirmDialogService)
  )
  .directive(
    'hsConfirmDialogComponent',
    downgradeComponent({component: HsConfirmDialogComponent})
  );

angular.module('hs.common.confirm', [downgradedModule]);

export {HsConfirmModule} from './confirm.module';
