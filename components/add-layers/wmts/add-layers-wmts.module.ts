import '../../../common/get-capabilities.module';
import '../../utils';
import * as angular from 'angular';
import addLayersWmtsComponent from './add-layers-wmts.component';
import addLayersWmtsService from './add-layers-wmts.service';
import capabilitiesErrorDirective from '../capabilities-error.directive';
import resampleDialogDirective from '../resample-dialog.directive';

/**
 * @namespace hs.addLayersWmts
 * @memberOf hs
 */
angular
  .module('hs.addLayersWmts', ['hs.utils', 'hs.getCapabilities'])
  /**
   * @name hs.addLayersWmts.resampleDialogDirective
   * @ngdoc directive
   * @memberOf hs.addLayersWmts
   * @description Directive for displaying warning dialog about resampling (proxying) wmts service
   */
  .directive(
    'hs.addLayersWmts.resampleDialogDirective',
    resampleDialogDirective
  )

  /**
   * @name hs.addLayersWmts.capabilitiesErrorDirective
   * @ngdoc directive
   * @memberOf hs.addLayersWmts
   * @description Directive for displaying dialog about getCapabilities request error
   */
  .directive('hs.wmts.capabilitiesErrorDirective', capabilitiesErrorDirective)

  /**
   * @name hs.addLayersWmts.service_layer_producer
   * @memberOf hs.addLayersWmts
   * @ngdoc service
   * @description Service for querying what layers are available in a wmts and adding them to map
   */
  .factory('HsAddLayersWmtsAddLayerService', addLayersWmtsService)

  /**
   * @name hs.addLayersWmts.controller
   * @ngdoc controller
   * @memberOf hs.addLayersWmts
   * @description Controller for displaying and setting parameters for wmts and its layers, which will be added to map afterwards
   */
  .component('hs.addLayersWmts', addLayersWmtsComponent);
