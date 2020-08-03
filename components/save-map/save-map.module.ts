import '../../common/layman/layman.module';
import '../../common/widgets/widgets.module';
import 'angular-cookies';
import * as angular from 'angular';
import laymanService from './layman.service';
import saveMapComponent from './save-map.component';
import saveMapManagerService from './save-map-manager.service';
import saveMapService from './save-map.service';
import statusManagerService from './status-manager.service';
import syncErrorDialogComponent from './sync-error-dialog.component';
import {HsLayerSynchronizerService} from './layer-synchronizer.service';

/**
 * @namespace hs.save-map
 * @memberOf hs
 */
angular
  .module('hs.save-map', [
    'hs.map',
    'hs.core',
    'ngCookies',
    'hs.widgets',
    'hs.common.layman',
  ])
  /**
   * @ngdoc directive
   * @name hs.save-map.directive
   * @memberof hs.save-map
   * @description Display Save map (composition) dialog
   */
  .directive('hs.save-map.directive', function () {
    'ngInject';
    return {
      template: require('./partials/dialog.html'),
    };
  })

  /**
   * @ngdoc directive
   * @name hs.saveMap.directiveForm
   * @memberof hs.save-map
   * @description Display advanced form to collect information (metadata) about saved composition
   */
  .directive('hs.saveMap.directiveForm', function () {
    'ngInject';
    return {
      template: require('./partials/form.html'),
    };
  })

  /**
   * @ngdoc directive
   * @name hs.saveMap.directiveSimpleform
   * @memberof hs.save-map
   * @description Display simple form to collect information (metadata) about saved composition
   */
  .directive('hs.saveMap.directiveSimpleform', function () {
    'ngInject';
    return {
      template: require('./partials/simpleform.html'),
    };
  })

  /**
   * @ngdoc directive
   * @name hs.saveMap.resultDialogDirective
   * @memberof hs.save-map
   * @description Display dialog about result of saving to status manager operation
   */
  .directive('hs.saveMap.resultDialogDirective', function () {
    'ngInject';
    return {
      template: require('./partials/dialog_result.html'),
      link: function (scope, element, attrs) {
        scope.resultModalVisible = true;
      },
    };
  })

  /**
   * @ngdoc directive
   * @name hs.saveMap.saveDialogDirective
   * @memberof hs.save-map
   * @description Display saving dialog (confirmation of saving, overwriting, selection of name)
   */
  .directive('hs.saveMap.saveDialogDirective', function () {
    'ngInject';
    return {
      template: require('./partials/dialog_save.html'),
      link: function (scope, element, attrs) {
        scope.saveCompositionModalVisible = true;
      },
    };
  })

  /**
   * @ngdoc service
   * @name HsSaveMapService
   * @memberof hs.save-map
   * @description Service for converting composition and composition data into JSON object which can be saved on server
   */
  .factory('HsSaveMapService', saveMapService)

  /**
   * @ngdoc service
   * @name HsSaveMapService
   * @memberof hs.save-map
   * @description Service for managing saving logic to various providers.
   * Currently Layman and Status manager are supported.
   */
  .factory('HsSaveMapManagerService', saveMapManagerService)

  /**
   * @ngdoc service
   * @name HsLaymanService
   * @memberof hs.save-map
   * @description Service for sending and retrieving compositions from Status
   * Manager backend
   */
  .factory('HsStatusManagerService', statusManagerService)

  /**
   * @ngdoc service
   * @name HsLaymanService
   * @memberof hs.save-map
   * @description Service for sending and retrieving data from Layman
   * (compositions, layers) (https://github.com/jirik/gspld)
   */
  .factory('HsLaymanService', laymanService)

  /**
   * @ngdoc service
   * @name HsLayerSynchronizerService
   * @memberof hs.save-map
   * @description Service which monitors vector layers and initiates sending
   * and gets requesting of features to/from Layman
   */
  .service('HsLayerSynchronizerService', HsLayerSynchronizerService)

  /**
   * @ngdoc component
   * @name hs.saveMap
   * @memberof hs.save-map
   * @description Save map panel
   */
  .component('hs.saveMap', saveMapComponent)

  .component('hsSyncErrorDialog', syncErrorDialogComponent);
