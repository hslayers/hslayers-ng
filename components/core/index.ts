import * as angular from 'angular';
// eslint-disable-next-line sort-imports-es6-autofix/sort-imports-es6
// 'angular-gettext' must be loaded before HSLayers modules
import 'angular-gettext';
// eslint-disable-next-line sort-imports-es6-autofix/sort-imports-es6
import '../drag/drag.module';
import '../draw';
import '../layermanager';
import '../layout';
import '../legend';
import '../map/map.module';
import '../permalink';
import '../print';
import '../save-map/';
import '../translations/js/translations';
import '../utils';
import {HsCoreModule} from './core.module';
import {HsCoreService} from './core.service';
import {HsEventBusService} from './event-bus.service';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedCoreModule = downgrade(HsCoreModule);
/**
 * @namespace hs
 * @ngdoc module
 * @module hs.core
 * @name hs.core
 * @description HsCore module for whole HSLayers-NG. HsCore module consists of HsCore service which keeps some app-level settings and mantain app size and panel statuses. TODO
 */
angular
  .module(downgradedCoreModule, [
    'hs.map',
    'gettext',
    'hs.drag',
    'hs.layout',
    'hs.utils',
    'hs.legend',
    'hs.print',
    'hs.layermanager',
    'hs.save-map',
    'hs.permalink',
  ])
  /**
   * @module hs.core
   * @name HsCore
   * @ngdoc service
   * @description HsCore service of HSL. TODO expand the description
   */
  .service('HsCore', downgradeInjectable(HsCoreService))
  .service('HsEventBusService', downgradeInjectable(HsEventBusService));

angular.module('hs.core', [downgradedCoreModule]);

export {HsCoreModule} from './core.module';
