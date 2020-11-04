/* eslint-disable angular/no-service-method */
import * as angular from 'angular';
import {HsArcgisGetCapabilitiesService} from '../arcgis/get-capabilities.service';
import {HsDimensionService} from '../dimension.service';
import {HsGetCapabilitiesModule} from './get-capabilities.module';
import {HsWfsGetCapabilitiesService} from '../wfs/get-capabilities.service';
import {HsWmsGetCapabilitiesService} from '../wms/get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../wmts/get-capabilities.service';
import {downgrade} from '../downgrader';
import {downgradeInjectable} from '@angular/upgrade/static';

export const downgradedGetCapabilitiesModule = downgrade(
  HsGetCapabilitiesModule
);

angular.module(downgradedGetCapabilitiesModule, []);

angular.module('hs.getCapabilities', [downgradedGetCapabilitiesModule]);

export {HsGetCapabilitiesModule} from './get-capabilities.module';

/**
 * @namespace hs.common
 * @memberOf hs
 */
angular
  .module('hs.getCapabilities', [])

  /**
   * @name HsWfsGetCapabilitiesService
   * @ngdoc service
   * @memberOf hs.getCapabilities
   * @description Service for GetCapabilities requests to WFS
   */
  .service(
    'HsWfsGetCapabilitiesService',
    downgradeInjectable(HsWfsGetCapabilitiesService)
  )

  /**
   * @class HsWmsGetCapabilitiesService
   * @ngdoc service
   * @memberOf hs.getCapabilities
   * @description Service for GetCapabilities requests to WMS
   */
  .service(
    'HsWmsGetCapabilitiesService',
    downgradeInjectable(HsWmsGetCapabilitiesService)
  )

  /**
   * @class HsArcgisGetCapabilitiesService
   * @ngdoc service
   * @memberOf hs.getCapabilities
   * @description Service for GetCapabilities requests to WMS
   */
  .service(
    'HsArcgisGetCapabilitiesService',
    downgradeInjectable(HsArcgisGetCapabilitiesService)
  )

  /**
   * @class HsDimensionService
   * @ngdoc service
   * @memberOf hs.getCapabilities
   * @description Service for filling dimension values such as time
   */
  .service('HsDimensionService', downgradeInjectable(HsDimensionService))

  /**
   * @name HsWmtsGetCapabilitiesService
   * @ngdoc service
   * @memberOf hs.getCapabilities
   * @description Service for GetCapabilities requests to WMTS
   */
  .service(
    'HsWmtsGetCapabilitiesService',
    downgradeInjectable(HsWmtsGetCapabilitiesService)
  );
