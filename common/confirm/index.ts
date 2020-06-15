import { downgradeInjectable, downgradeComponent } from '@angular/upgrade/static';
import { HsConfirmModule } from './confirm.module';
import * as angular from "angular";
import { HsConfirmDialog } from './confirm-dialog.service';
import { HsConfirmDialogComponent } from './confirm-dialog.component';
import {downgrade} from '../downgrader';

export const downgradedCommonConfirmModule = downgrade(HsConfirmModule);
angular
    .module(downgradedCommonConfirmModule)
    .factory('HsConfirmDialog', downgradeInjectable(HsConfirmDialog))
    .directive('hsConfirmDialogComponent', downgradeComponent({ component: HsConfirmDialogComponent }));

angular
    .module('hs.common.confirm', [downgradedCommonConfirmModule])

export * from './confirm-dialog.service';