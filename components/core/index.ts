import '../drag/drag.module';
import '../map/map.module';
import '../utils/utils.module';
import 'angular-gettext';
import * as angular from "angular";
import '../layout';
import '../legend';
import '../print';
import '../translations/js/translations';
import {HsCoreService} from './core.service';
import { downgradeInjectable, downgradeComponent } from '@angular/upgrade/static';
import { HsCoreModule } from './core.module';
import { downgrade } from '../../common/downgrader';

export const downgradedCoreModule = downgrade(HsCoreModule);
/**
 * @namespace hs
 * @ngdoc module
 * @module hs.core
 * @name hs.core
 * @description HsCore module for whole HSLayers-NG. HsCore module consists of HsCore service which keeps some app-level settings and mantain app size and panel statuses. TODO
 */
angular
  .module(downgradedCoreModule, ['hs.map', 'gettext', 'hs.drag', 'hs.layout', 'hs.utils', 'hs.legend', 'hs.print'])
  /**
   * @module hs.core
   * @name HsCore
   * @ngdoc service
   * @description HsCore service of HSL. TODO expand the description
   */
  .service('HsCore', downgradeInjectable(HsCoreService));

angular
  .module('hs.core', [downgradedCoreModule]);

export { HsCoreModule } from './core.module';