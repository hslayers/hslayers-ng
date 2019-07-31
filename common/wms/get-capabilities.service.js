import { WMSCapabilities } from 'ol/format';
import 'components/utils/utils.module';
import { Tile } from 'ol/layer';
import { TileWMS } from 'ol/source';
import { Attribution } from 'ol/control.js';
import { getPreferedFormat } from '../format-utils';

export default ['$http', 'hs.map.service', 'hs.utils.service', '$rootScope', function ($http, OlMap, utils, $rootScope) {
    var me = this;

    /**
    * Get WMS service location without parameters from url string
    * @memberof hs.wms.getCapabilitiesService
    * @function getPathFromUrl
    * @param {String} str Url string to parse
    * @returns {String} WMS service Url
    */
    this.getPathFromUrl = function (str) {
        if (str.indexOf('?') > -1)
            return str.substring(0, str.indexOf("?"));
        else
            return str;
    };

    /**
     * TODO: Probably the same as utils.paramsToURL
    * Create WMS parameter string from parameter object 
    * @memberof hs.wms.getCapabilitiesService
    * @function param2String
    * @param {Object} obj Object with stored WNS service parameters
    * @returns {String} Parameter string or empty string if no object given 
    */
    this.params2String = function (obj) {
        return obj ? Object.keys(obj).map(function (key) {
            var val = obj[key];

            if (Array.isArray(val)) {
                return val.map(function (val2) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(val2);
                }).join('&');
            }

            return encodeURIComponent(key) + '=' + encodeURIComponent(val);
        }).join('&') : '';
    };

    /**
    * Parse added service url and sends GetCapabalities request to WMS service
    * @memberof hs.wms.getCapabilitiesService
    * @function requestGetCapabilities
    * @param {String} service_url Raw Url localization of service
    * @returns {Promise} Promise object - Response to GetCapabalities request
    */
    this.requestGetCapabilities = function (service_url) {
        service_url = service_url.replace('&amp;', '&');
        var params = utils.getParamsFromUrl(service_url);
        var path = this.getPathFromUrl(service_url);
        if (angular.isUndefined(params.request) && angular.isUndefined(params.REQUEST)) params.request = 'GetCapabilities';
        else
            if (angular.isDefined(params.request)) params.request = 'GetCapabilities';
            else
                if (angular.isDefined(params.REQUEST)) params.REQUEST = 'GetCapabilities';
        if (angular.isUndefined(params.service) && angular.isUndefined(params.SERVICE)) params.service = 'WMS';
        if (angular.isUndefined(params.version) && angular.isUndefined(params.VERSION)) params.version = '1.3.0';
        var url = [path, me.params2String(params)].join('?');

        url = utils.proxify(url);
        return new Promise((resolve, reject) => {
            $http.get(url).then((r) => {
                $rootScope.$broadcast('ows.capabilities_received', r)
                resolve(r.data);
            }).catch((e) => { reject(e) })
        })
    };

    /**
    * Load all layers of selected service to the map
    * @memberof hs.wms.getCapabilitiesService
    * @function service2layers
    * @param {String} capabilities_xml Xml response of GetCapabilities of selected service
    * @returns {Ol.collection} List of layers from service
    */
    this.service2layers = function (capabilities_xml) {
        var parser = new WMSCapabilities();
        var caps = parser.read(capabilities_xml);
        var service = caps.Capability.Layer;
        var srss = caps.Capability.Layer.CRS;
        var image_formats = caps.Capability.Request.GetMap.Format;
        var query_formats = (caps.Capability.Request.GetFeatureInfo ? caps.Capability.Request.GetFeatureInfo.Format : []);
        var image_format = getPreferedFormat(image_formats, ["image/png; mode=8bit", "image/png", "image/gif", "image/jpeg"]);
        var query_format = getPreferedFormat(query_formats, ["application/vnd.esri.wms_featureinfo_xml", "application/vnd.ogc.gml", "application/vnd.ogc.wms_xml", "text/plain", "text/html"]);

        var tmp = [];
        angular.forEach(service, function () {
            if (console) console.log("Load service", this);
            angular.forEach(this.Layer, function () {
                layer = this;
                if (console) console.log("Load service", this);
                var attributions = [];
                if (layer.Attribution) {
                    attributions = [new Attribution({
                        html: '<a href="' + layer.Attribution.OnlineResource + '">' + layer.Attribution.Title + '</a>'
                    })];
                }
                var new_layer = new Tile({
                    title: layer.Title.replace(/\//g, "&#47;"),
                    source: new TileWMS({
                        url: caps.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource,
                        attributions: attributions,
                        styles: layer.Style && layer.Style.length > 0 ? layer.Style[0].Name : undefined,
                        params: {
                            LAYERS: layer.Name,
                            INFO_FORMAT: (layer.queryable ? query_format : undefined),
                            FORMAT: image_format
                        },
                        crossOrigin: 'anonymous'
                    }),
                    abstract: layer.Abstract,
                    useInterimTilesOnError: false,
                    MetadataURL: layer.MetadataURL,
                    BoundingBox: layer.BoundingBox
                });
                OlMap.proxifyLayerLoader(new_layer, true);
                tmp.push(new_layer);
            })
        })
        return tmp;
    }

    /**
    * Test if current map projection is in supported projection list
    * @memberof hs.wms.getCapabilitiesService
    * @function currentProjectionSupported
    * @param {Array} srss List of supported projections
    * @returns {Boolean} True if map projection is in list, otherwise false
    */
    this.currentProjectionSupported = function (srss) {
        var found = false;
        angular.forEach(srss, function (val) {
            if (OlMap.map.getView().getProjection().getCode().toUpperCase() == val.toUpperCase()) found = true;
        })
        return found;
    }

}];
