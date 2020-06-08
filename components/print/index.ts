import { downgradeInjectable, downgradeComponent } from '@angular/upgrade/static';
import { HsPrintModule } from './print.module';
import * as angular from "angular";
import { downgrade } from '../../common/downgrader';
import { HsPrintService } from './print.service';
import { HsPrintComponent } from './print.component';

export const downgradedPrintModule = downgrade(HsPrintModule);

angular
    .module(downgradedPrintModule, [])

    .directive('hs.print', downgradeComponent({ component: HsPrintComponent }))
    /**
     * @memberof hs.print
     * @ngdoc service
     * @name HsPrintService
     */
    .factory('HsPrintService', downgradeInjectable(HsPrintService));

export * from './print.service';