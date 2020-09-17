import '../../../common/get-capabilities.module';
import '../../utils';
import * as angular from 'angular';
import {HsAddLayersWfsComponent} from './add-layers-wfs.component';
import {HsGetCapabilitiesErrorComponent} from '../capabilities-error.component';

/**
 * @namespace hs.addLayersWfs
 * @memberOf hs
 */
angular
  .module('hs.addLayersWfs', ['hs.utils', 'hs.getCapabilities'])

  /**
   * @name hs.addLayersWfs.capabalitiesErrorDirective
   * @ngdoc directive
   * @memberOf hs.addLayersWfs
   * @description Display GetCapabilities error dialog template
   */
  .component(
    'hs.addLayersWfs.capabilitiesErrorDirective',
    HsGetCapabilitiesErrorComponent
  )

  /**
   * @name hs.addLayersWfs
   * @ngdoc controller
   * @memberOf hs.addLayersWfs
   * @description Controller for displaying and setting parameters for Wfs and its layers, which will be added to map afterwards
   */
  .component('hs.addLayersWfs', HsAddLayersWfsComponent);
