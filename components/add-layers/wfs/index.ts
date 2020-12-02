import '../../../common/get-capabilities';
import '../../utils';
import * as angular from 'angular';
import {HsAddLayersWfsComponent} from './add-layers-wfs.component';
import {HsAddLayersWfsModule} from './add-layers-wfs.module';
import {HsAddLayersWfsService} from './add-layers-wfs.service';
import {HsGetCapabilitiesErrorComponent} from '../capabilities-error.component';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

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
  .service('HsAddLayersWfsService', downgradeInjectable(HsAddLayersWfsService))
  /**
   * @name hs.addLayersWfs
   * @ngdoc controller
   * @memberof hs.addLayersWfs
   * @description Controller for displaying and setting parameters for Wfs and its layers, which will be added to map afterwards
   */
  .directive(
    'hs.addLayersWfs',
    downgradeComponent({component: HsAddLayersWfsComponent})
  );
angular.module('hs.addLayersWfs', [downgradedAddLayersWfsModule]);

export {HsAddLayersWfsModule} from './add-layers-wfs.module';
