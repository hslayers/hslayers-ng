import '../../../common/get-capabilities.module';
import '../../utils';
import * as angular from 'angular';
import {HsAddLayersWfsComponent} from './add-layers-wfs.component';
import {HsAddLayersWfsModule} from './add-layers-wfs.module';
import {HsGetCapabilitiesErrorComponent} from '../capabilities-error.component';
import {downgrade} from '../../../common/downgrader';

export const downgradedAddLayersWfsModule = downgrade(HsAddLayersWfsModule);

/**
 * @namespace hs.addLayersWfs
 * @memberof hs
 */
angular
  .module(downgradedAddLayersWfsModule, ['hs.utils', 'hs.getCapabilities'])

  /**
   * @name hs.addLayersWfs.capabalitiesErrorDirective
   * @ngdoc directive
   * @memberof hs.addLayersWfs
   * @description Display GetCapabilities error dialog template
   */
  .component(
    'hs.addLayersWfs.capabilitiesErrorDirective',
    HsGetCapabilitiesErrorComponent
  )

  /**
   * @name hs.addLayersWfs
   * @ngdoc controller
   * @memberof hs.addLayersWfs
   * @description Controller for displaying and setting parameters for Wfs and its layers, which will be added to map afterwards
   */
  .component('hs.addLayersWfs', HsAddLayersWfsComponent);

angular.module('hs.addLayersWfs', [downgradedAddLayersWfsModule]);

export {HsAddLayersWfsModule} from './add-layers-wfs.module';
