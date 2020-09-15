import * as angular from 'angular';
// eslint-disable-next-line sort-imports-es6-autofix/sort-imports-es6
// 'angular-gettext' must be loaded before HSLayers modules
import 'angular-gettext';
// eslint-disable-next-line sort-imports-es6-autofix/sort-imports-es6
import '../../common/confirm';
import '../../common/history-list';
import '../drag/drag.module';
import '../draw';
import '../geolocation';
import '../info';
import '../language';
import '../layermanager';
import '../layout';
import '../legend';
import '../map';
import '../permalink';
import '../print';
import '../query';
import '../save-map/';
import '../toolbar';
import '../translations/js/translations';
import '../utils';
import {HsCoreModule} from './core.module';
import {HsCoreService} from './core.service';
import {HsEventBusService} from './event-bus.service';
import {downgrade} from '../../common/downgrader';
import {downgradeInjectable} from '@angular/upgrade/static';

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
    'hs.language',
    'hs.geolocation',
    'hs.layout',
    'hs.utils',
    'hs.legend',
    'hs.print',
    'hs.layermanager',
    'hs.save-map',
    'hs.permalink',
    'hs.historyList',
    'hs.common.confirm',
    'hs.toolbar',
    'hs.info',
    'hs.query',
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
