import '../../utils/utils.module';
import addLayersWmsService from './add-layers-wms.service';
import addLayersWmsComponent from './add-layers-wms.component';
import resampleDialogDirective from '../resample-dialog.directive';
import capabilitiesErrorDirective from '../capabilities-error.directive';
import '../../../common/get-capabilities.module';

/**
 * @namespace hs.addLayersWms
 * @memberOf hs
 */
angular.module('hs.addLayersWms', ['hs.utils', 'hs.getCapabilities'])

/**
 * @name hs.addLayersWms.resampleDialogDirective
 * @ngdoc directive
 * @memberOf hs.addLayersWms
 * @description Directive for displaying warning dialog about resampling (proxying) wms service
 */
  .directive('hs.addLayersWms.resampleDialogDirective', resampleDialogDirective)

/**
 * @name hs.addLayersWms.capabilitiesErrorDirective
 * @ngdoc directive
 * @memberOf hs.addLayersWms
 * @description Directive for displaying dialog about getCapabilities request error
 */
  .directive('hs.addLayersWms.capabilitiesErrorDirective', capabilitiesErrorDirective)

//TODO missing description
  .factory('hs.addLayersWms.addLayerService', addLayersWmsService)

/**
 * @name hs.addLayersWms.controller
 * @ngdoc controller
 * @memberOf hs.addLayersWms
 * @description Controller for displaying and setting parameters for Wms and its layers, which will be added to map afterwards
 */
  .component('hs.addLayersWms', addLayersWmsComponent);
