import '../../utils';
import * as angular from 'angular';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

import {HsAddLayersArcGisComponent} from './add-layers-arcgis.component';
import {HsAddLayersArcGisModule} from './add-layers-arcgis.module';
import {HsAddLayersArcGisService} from './add-layers-arcgis.service';
import {downgrade} from '../../../common/downgrader';

export const downgradedAddLayersArcGisModule = downgrade(
  HsAddLayersArcGisModule
);

/**
 * @namespace hs.addLayersArcgis
 * @memberof hs
 */
angular
  .module(downgradedAddLayersArcGisModule, ['hs.utils', 'hs.getCapabilities'])

  .service(
    'HsAddLayersArcgisAddLayerService',
    downgradeInjectable(HsAddLayersArcGisService)
  )

  /**
   * @name hs.addLayersArcgis.controller
   * @ngdoc controller
   * @memberof hs.addLayersArcgis
   * @description Controller for displaying and setting parameters for Arcgis and its layers, which will be added to map afterwards
   */
  .component(
    'hs.addLayersArcgis',
    downgradeComponent({component: HsAddLayersArcGisComponent})
  );

angular.module('hs.addLayersArcgis', [downgradedAddLayersArcGisModule]);

export {HsAddLayersArcGisModule} from './add-layers-arcgis.module';
