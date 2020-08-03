import angular from 'angular';
import endpointsService from './endpoints.service';

angular
  .module('hs.common.endpoints', [])

  /**
   * @name HsCommonEndpointsService
   * @ngdoc service
   * @memberOf hs.common.endpoints
   * @description Service for endpoints
   */
  .service('HsCommonEndpointsService', endpointsService);
