import laymanCurrentUserComponent from './layman-current-user.component';
import laymanLoginComponent from './layman-login.component';
import {HsCommonLaymanService} from './layman.service';

angular
  .module('hs.common.layman', [])

  /**
   * @name HsCommonLaymanService
   * @ngdoc service
   * @memberOf hs.common.layman
   * @description Service for common Layman functions
   */
  .factory('HsCommonLaymanService', HsCommonLaymanService)

  .component('hs.layman.currentUser', laymanCurrentUserComponent)

  .component('hs.laymanLogin', laymanLoginComponent);
