import '../../common/endpoints/endpoints.module';
import '../utils/utils.module';
import './endpoints/compositions-endpoints.module';
import './layer-parser.module';
import 'angular-socialshare';
import compositionsComponent from './compositions.component';
import compositionsMapService from './compositions-map.service';
import compositionsService from './compositions.service';
import deleteDialogDirective from './delete-dialog.directive';
import errorDialogComponent from './error-dialog.component';
import infoDialogDirective from './info-dialog.directive';
import overwriteDialogDirective from './overwrite-dialog.directive';
import parserService from './compositions-parser.service';
import shareDialogDirective from './share-dialog.directive';

/**
 * @ngdoc module
 * @module hs.compositions
 * @name hs.compositions
 * @description Test composition module
 */
angular
  .module('hs.compositions', [
    '720kb.socialshare',
    'hs.map',
    'hs.core',
    'hs.compositions.layerParser',
    'hs.compositions.endpoints',
    'hs.common.endpoints',
  ])
  /**
   * @module hs.compositions
   * @name hs.compositions.overwriteDialogDirective
   * @ngdoc directive
   * @description Display dialog window for situation, when new composition is to be loaded while there are unsaved changes in old composition
   */
  .directive(
    'hs.compositions.overwriteDialogDirective',
    overwriteDialogDirective
  )

  /**
   * @module hs.compositions
   * @name hs.compositions.deleteDialogDirective
   * @ngdoc directive
   * @description Display dialog window for confiriming deletion of selected composition
   */
  .directive('hs.compositions.deleteDialogDirective', deleteDialogDirective)

  /**
   * @module hs.compositions
   * @name hs.compositions.shareDialogDirective
   * @ngdoc directive
   * @description Display dialog of sharing composition (URL / Social networks)
   */
  .directive('hs.compositions.shareDialogDirective', shareDialogDirective)

  /**
   * @module hs.compositions
   * @name hs.compositions.infoDialogDirective
   * @ngdoc directive
   * @description Display dialog of composition info (name, abstract, thumbnail, extent, layers)
   */
  .directive('hs.compositions.infoDialogDirective', infoDialogDirective)

  /**
   * @module hs.compositions
   * @name HsCompositionsService
   * @ngdoc controller
   * @description Service of composition module
   */
  .factory('HsCompositionsService', compositionsService)

  /**
   * @module hs.compositions
   * @name HsCompositionsMapService
   * @ngdoc controller
   * @description Service of composition module which deal ith Openlayers map objects
   */
  .factory('HsCompositionsMapService', compositionsMapService)

  /**
   * @module hs.compositions
   * @name HsCompositionsParserService
   * @ngdoc service
   * @description Contains function of managing composition (loading, removing Layers)
   */
  .factory('HsCompositionsParserService', parserService)
  /**
   * @module hs.compositions
   * @name hs.compositions
   * @ngdoc component
   * @description Error dialog component
   */
  .component('hs.compositions.errorDialogComponent', errorDialogComponent)

  /**
   * @module hs.compositions
   * @name hs.compositions
   * @ngdoc component
   * @description Main controller of composition module
   */
  .component('hs.compositions', compositionsComponent);
