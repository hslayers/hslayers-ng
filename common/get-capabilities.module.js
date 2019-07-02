import wfsGetCapabilitiesService from './wfs/get-capabilities.service';
import wmsGetCapabilitiesService from './wms/get-capabilities.service';
import wmtsGetCapabilities from './wmts/get-capabilities.service';

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
    .service("hs.wfs.getCapabilitiesService", wfsGetCapabilitiesService)

    /**
     * @class hs.wms.getCapabilitiesService
     * @ngdoc service
     * @memberOf hs.getCapabilities
     * @description Service for GetCapabilities requests to WMS
     */
    .service("hs.wms.getCapabilitiesService", wmsGetCapabilitiesService)

    /**
     * @name hs.wmts.getCapabilitiesService
     * @ngdoc service
     * @memberOf hs.getCapabilities
     * @description Service for GetCapabilities requests to WMTS
     */
    .service("hs.wmts.getCapabilitiesService", wmtsGetCapabilities)
