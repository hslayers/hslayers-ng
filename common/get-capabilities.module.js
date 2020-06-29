/* eslint-disable angular/no-service-method */
import HsArcgisGetCapabilitiesService from './arcgis/get-capabilities.service';
import {HsDimensionService} from './dimension.service';
import {HsWfsGetCapabilitiesService} from './wfs/get-capabilities.service';
import {HsWmsGetCapabilitiesService} from './wms/get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from './wmts/get-capabilities.service';

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
  .service('HsWfsGetCapabilitiesService', HsWfsGetCapabilitiesService)

  /**
   * @class HsWmsGetCapabilitiesService
   * @ngdoc service
   * @memberOf hs.getCapabilities
   * @description Service for GetCapabilities requests to WMS
   */
  .service('HsWmsGetCapabilitiesService', HsWmsGetCapabilitiesService)

  /**
   * @class HsArcgisGetCapabilitiesService
   * @ngdoc service
   * @memberOf hs.getCapabilities
   * @description Service for GetCapabilities requests to WMS
   */
  .factory('HsArcgisGetCapabilitiesService', HsArcgisGetCapabilitiesService)

  /**
   * @class HsDimensionService
   * @ngdoc service
   * @memberOf hs.getCapabilities
   * @description Service for filling dimension values such as time
   */
  .service('HsDimensionService', HsDimensionService)

  /**
   * @name HsWmtsGetCapabilitiesService
   * @ngdoc service
   * @memberOf hs.getCapabilities
   * @description Service for GetCapabilities requests to WMTS
   */
  .service('HsWmtsGetCapabilitiesService', HsWmtsGetCapabilitiesService);
