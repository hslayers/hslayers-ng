import compositionsLaymanService from './compositions-layman.service';
import forCompositionFilter from './for-composition.filter';
import mickaService from './compositions-micka.service';
import statusManagerMickaJointService from './status-manager-micka-joint.service';
import statusManagerService from './compositions-status-manager.service';

/**
 * @ngdoc module
 * @module hs.compositions.endpoints
 * @name hs.compositions.endpoints
 */
angular
  .module('hs.compositions.endpoints', [])

  /**
   * @module HsCompositionsMickaService
   * @ngdoc service
   * @name hs.compositions.endpoints
   * @description Service for gettign compositions from Micka
   */
  .factory('HsCompositionsMickaService', mickaService)

  /**
   * @module HsCompositionsLaymanService
   * @ngdoc service
   * @name hs.compositions.endpoints
   * @description Service for gettign compositions from Layman
   */
  .factory('HsCompositionsLaymanService', compositionsLaymanService)

  /**
   * @module HsCompositionsStatusManagerService
   * @ngdoc service
   * @name hs.compositions.endpoints
   * @description Service for getting list of compositions from statusmanager.
   */
  .factory('HsCompositionsStatusManagerService', statusManagerService)

  /**
  * @module HsCompositionsStatusManagerMickaJointService
  * @ngdoc service
  * @name hs.compositions.endpoints
  * @description Service for getting list of compositions from statusmanager.
  Links together with mickaService to make micka compositions editable.
  */
  .factory(
    'HsCompositionsStatusManagerMickaJointService',
    statusManagerMickaJointService
  )

  .filter('forCompositions', forCompositionFilter);
