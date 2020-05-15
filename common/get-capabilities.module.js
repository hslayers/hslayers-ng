import arcgisGetCapabilitiesService from './arcgis/get-capabilities.service';
import dimensionService from './dimension.service';
import wfsGetCapabilitiesService from './wfs/get-capabilities.service';
import wmsGetCapabilitiesService from './wms/get-capabilities.service';
import wmtsGetCapabilities from './wmts/get-capabilities.service';

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
  .factory('HsWfsGetCapabilitiesService', wfsGetCapabilitiesService)

  /**
   * @class HsWmsGetCapabilitiesService
   * @ngdoc service
   * @memberOf hs.getCapabilities
   * @description Service for GetCapabilities requests to WMS
   */
  .factory('HsWmsGetCapabilitiesService', wmsGetCapabilitiesService)

  /**
   * @class HsArcgisGetCapabilitiesService
   * @ngdoc service
   * @memberOf hs.getCapabilities
   * @description Service for GetCapabilities requests to WMS
   */
  .factory('HsArcgisGetCapabilitiesService', arcgisGetCapabilitiesService)

  /**
   * @class HsDimensionService
   * @ngdoc service
   * @memberOf hs.getCapabilities
   * @description Service for filling dimension values such as time
   */
  .factory('HsDimensionService', dimensionService)

  /**
   * @name HsWmtsGetCapabilitiesService
   * @ngdoc service
   * @memberOf hs.getCapabilities
   * @description Service for GetCapabilities requests to WMTS
   */
  .factory('HsWmtsGetCapabilitiesService', wmtsGetCapabilities);
