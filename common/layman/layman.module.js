import laymanCurrentUserComponent from './layman-current-user.component';
import laymanLoginComponent from './layman-login.component';
import laymanService from './layman.service';

angular
  .module('hs.common.layman', [])

  /**
   * @name hs.common.laymanService
   * @ngdoc service
   * @memberOf hs.common.layman
   * @description Service for common Layman functions
   */
  .factory('hs.common.laymanService', laymanService)

  .component('hs.layman.currentUser', laymanCurrentUserComponent)

  .component('hs.laymanLogin', laymanLoginComponent);
