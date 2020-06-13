import layerUtilsService from './layer-utils.service';
import {HsUtilsService} from './utils.service';
import * as angular from 'angular';

/**
 * @ngdoc module
 * @module hs.utils
 * @name hs.utils
 * @description Utility module which contains few utility functions.
 */
angular
  .module('hs.utils', ['hs'])

  /**
   * @ngdoc service
   * @name HsUtilsService
   * @module hs.utils
   * @param {object} config - Application configuration
   * @description Service for containing various utility functions used throughout HSL modules.
   * Add few utility functions and also enrich some data types with additional functions (mainly Date and String).
   */
  .service('HsUtilsService', HsUtilsService)

  /**
   * @ngdoc service
   * @name HsLayerUtilsService
   * @module hs.utils
   * @param {object} config - Application configuration
   * @description Service containing varius functions for testing layer functionalities
   */
  .factory('HsLayerUtilsService', layerUtilsService);
