import '../drag/drag.module';
import '../layout/layout.module';
import '../map/map.module';
import '../utils/utils.module';
import 'angular-gettext';
import '../translations/js/translations';
import coreService from './core.service';

/**
 * @namespace hs
 * @ngdoc module
 * @module hs.core
 * @name hs.core
 * @description HsCore module for whole HSLayers-NG. HsCore module consists of HsCore service which keeps some app-level settings and mantain app size and panel statuses. TODO
 */
angular
  .module('hs.core', ['hs.map', 'gettext', 'hs.drag', 'hs.layout', 'hs.utils'])
  /**
   * @module hs.core
   * @name HsCore
   * @ngdoc service
   * @description HsCore service of HSL. TODO expand the description
   */
  .factory('HsCore', coreService);
