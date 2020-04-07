import '../drag/drag.module';
import '../layout/layout.module';
import '../map/map.module';
import '../translations/';
import '../translations/js/translations';
import '../utils/utils.module';
import 'angular-gettext';
import coreService from './core.service';

/**
 * @namespace hs
 * @ngdoc module
 * @module hs.core
 * @name hs.core
 * @description Core module for whole HSLayers-NG. Core module consists of Core service which keeps some app-level settings and mantain app size and panel statuses. TODO
 */
angular
  .module('hs.core', ['hs.map', 'gettext', 'hs.drag', 'hs.layout', 'hs.utils'])
  /**
   * @module hs.core
   * @name Core
   * @ngdoc service
   * @description Core service of HSL. TODO expand the description
   */
  .factory('Core', coreService);
