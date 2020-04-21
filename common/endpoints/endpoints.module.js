import angular from 'angular';
import endpointsService from './endpoints.service';

angular
  .module('hs.common.endpoints', [])

  /**
   * @name hs.common.endpointsService
   * @ngdoc service
   * @memberOf hs.common.endpoints
   * @description Service for endpoints
   */
  .factory('hs.common.endpointsService', endpointsService);
