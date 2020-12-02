import '../../../common/get-capabilities';
import '../../utils';
import * as angular from 'angular';
import {HsAddLayersWmtsComponent} from './add-layers-wmts.component';
import {HsAddLayersWmtsModule} from './add-layers-wmts.module';
import {HsAddLayersWmtsService} from './add-layers-wmts.service';
import {HsGetCapabilitiesErrorComponent} from '../common/capabilities-error-dialog.component';
import {HsResampleDialogComponent} from '../resample-dialog.component';
import {downgrade} from '../../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedAddLayersWmtsModule = downgrade(HsAddLayersWmtsModule);

/**
 * @namespace hs.addLayersWmts
 * @memberof hs
 */
angular
  .module(downgradedAddLayersWmtsModule, ['hs.utils', 'hs.getCapabilities'])
  /**
   * @name hs.addLayersWmts.resampleDialogDirective
   * @ngdoc directive
   * @memberof hs.addLayersWmts
   * @description Directive for displaying warning dialog about resampling (proxying) wmts service
   */
  .component(
    'hs.addLayersWmts.resampleDialogDirective',
    HsResampleDialogComponent
  )

  /**
   * @name hs.addLayersWmts.capabilitiesErrorDirective
   * @ngdoc directive
   * @memberof hs.addLayersWmts
   * @description Directive for displaying dialog about getCapabilities request error
   */
  .component(
    'hs.wmts.capabilitiesErrorDirective',
    HsGetCapabilitiesErrorComponent
  )

  /**
   * @name hs.addLayersWmts.service_layer_producer
   * @memberof hs.addLayersWmts
   * @ngdoc service
   * @description Service for querying what layers are available in a wmts and adding them to map
   */
  .service(
    'HsAddLayersWmtsAddLayerService',
    downgradeInjectable(HsAddLayersWmtsService)
  )

  /**
   * @name hs.addLayersWmts.controller
   * @ngdoc controller
   * @memberof hs.addLayersWmts
   * @description Controller for displaying and setting parameters for wmts and its layers, which will be added to map afterwards
   */
  .directive(
    'hs.addLayersWmts',
    downgradeComponent({component: HsAddLayersWmtsComponent})
  );

angular.module('hs.addLayersWmts', [downgradedAddLayersWmtsModule]);

export {HsAddLayersWmtsModule} from './add-layers-wmts.module';
