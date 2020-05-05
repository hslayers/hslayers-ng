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
   * @module hs.compositions.mickaService
   * @ngdoc service
   * @name hs.compositions.endpoints
   * @description Service for gettign compositions from Micka
   */
  .factory('hs.compositions.mickaService', mickaService)

  /**
   * @module hs.compositions.laymanService
   * @ngdoc service
   * @name hs.compositions.endpoints
   * @description Service for gettign compositions from Layman
   */
  .factory('hs.compositions.laymanService', compositionsLaymanService)

  /**
   * @module hs.compositions.statusManagerService
   * @ngdoc service
   * @name hs.compositions.endpoints
   * @description Service for getting list of compositions from statusmanager.
   */
  .factory('hs.compositions.statusManagerService', statusManagerService)

  /**
  * @module hs.compositions.statusManagerMickaJointService
  * @ngdoc service
  * @name hs.compositions.endpoints
  * @description Service for getting list of compositions from statusmanager.
  Links together with mickaService to make micka compositions editable.
  */
  .factory(
    'hs.compositions.statusManagerMickaJointService',
    statusManagerMickaJointService
  )

  .filter('forCompositions', forCompositionFilter);
