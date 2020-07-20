/* eslint-disable angular/no-service-method */
import * as angular from 'angular';

import {HsStylerColorComponent} from './styler-color.component';
import {HsStylerComponent} from './styler.component';
import {HsStylerModule} from './styles.module';
import {HsStylerService} from './styler.service';

import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsStylerModule);
/**
 * @namespace hs.styles
 * @memberOf hs
 */
angular
  .module(downgradedModule, ['hs.map'])
  .service('HsStylerService', downgradeInjectable(HsStylerService))
  .directive('hs.styles', downgradeComponent({component: HsStylerComponent}))
  .directive(
    'hs.stylerColor',
    downgradeComponent({component: HsStylerColorComponent})
  );

angular.module('hs.styles', [downgradedModule]);
export {HsStylerModule} from './styles.module';
