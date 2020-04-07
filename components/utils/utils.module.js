import layerUtilsService from './layer-utils.service';
import utilsService from './utils.service';

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
   * @name hs.utils.service
   * @module hs.utils
   * @param {object} config - Application configuration
   * @description Service for containing various utility functions used throughout HSL modules.
   * Add few utility functions and also enrich some data types with additional functions (mainly Date and String).
   */
  .factory('hs.utils.service', utilsService)

  /**
   * @ngdoc service
   * @name hs.utils.layerUtilsService
   * @module hs.utils
   * @param {object} config - Application configuration
   * @description Service containing varius functions for testing layer functionalities
   */
  .factory('hs.utils.layerUtilsService', layerUtilsService);
