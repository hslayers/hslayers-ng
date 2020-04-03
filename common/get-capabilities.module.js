import wfsGetCapabilitiesService from './wfs/get-capabilities.service';
import wmsGetCapabilitiesService from './wms/get-capabilities.service';
import arcgisGetCapabilitiesService from './arcgis/get-capabilities.service';
import wmtsGetCapabilities from './wmts/get-capabilities.service';
import dimensionService from './dimension.service';

/**
* @namespace hs.common
* @memberOf hs
*/
angular.module('hs.getCapabilities', [])

/**
    * @name hs.wfs.getCapabilitiesService
    * @ngdoc service
    * @memberOf hs.getCapabilities
    * @description Service for GetCapabilities requests to WFS
    */
  .factory('hs.wfs.getCapabilitiesService', wfsGetCapabilitiesService)

/**
     * @class hs.wms.getCapabilitiesService
     * @ngdoc service
     * @memberOf hs.getCapabilities
     * @description Service for GetCapabilities requests to WMS
     */
  .factory('hs.wms.getCapabilitiesService', wmsGetCapabilitiesService)


/**
     * @class hs.arcgis.getCapabilitiesService
     * @ngdoc service
     * @memberOf hs.getCapabilities
     * @description Service for GetCapabilities requests to WMS
     */
  .factory('hs.arcgis.getCapabilitiesService', arcgisGetCapabilitiesService)


/**
     * @class hs.dimensionService
     * @ngdoc service
     * @memberOf hs.getCapabilities
     * @description Service for filling dimension values such as time
     */
  .factory('hs.dimensionService', dimensionService)

/**
     * @name hs.wmts.getCapabilitiesService
     * @ngdoc service
     * @memberOf hs.getCapabilities
     * @description Service for GetCapabilities requests to WMTS
     */
  .factory('hs.wmts.getCapabilitiesService', wmtsGetCapabilities);
