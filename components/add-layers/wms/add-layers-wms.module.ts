import * as angular from 'angular';

import '../../../common/get-capabilities.module';
import '../../utils';
import {HsAddLayersWmsComponent} from './add-layers-wms.component';
import {HsAddLayersWmsService} from './add-layers-wms.service';
import {HsGetCapabilitiesErrorComponent} from '../capabilities-error.component';
import {HsResampleDialogComponent} from '../resample-dialog.component';

/**
 * @namespace hs.addLayersWms
 * @memberof hs
 */
angular
  .module('hs.addLayersWms', ['hs.utils', 'hs.getCapabilities'])

  /**
   * @name hs.addLayersWms.resampleDialogDirective
   * @ngdoc directive
   * @memberof hs.addLayersWms
   * @description Directive for displaying warning dialog about resampling (proxying) wms service
   */
  .component(
    'hs.addLayersWms.resampleDialogDirective',
    HsResampleDialogComponent
  )

  /**
   * @name hs.addLayersWms.capabilitiesErrorDirective
   * @ngdoc directive
   * @memberof hs.addLayersWms
   * @description Directive for displaying dialog about getCapabilities request error
   */
  .component(
    'hs.addLayersWms.capabilitiesErrorDirective',
    HsGetCapabilitiesErrorComponent
  )

  //TODO missing description
  .factory('HsAddLayersWmsAddLayerService', HsAddLayersWmsService)

  /**
   * @name hs.addLayersWms.controller
   * @ngdoc controller
   * @memberof hs.addLayersWms
   * @description Controller for displaying and setting parameters for Wms and its layers, which will be added to map afterwards
   */
  .component('hs.addLayersWms', HsAddLayersWmsComponent);
