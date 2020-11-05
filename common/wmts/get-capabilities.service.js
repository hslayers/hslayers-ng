import '../../components/utils/utils.module';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import {Attribution} from 'ol/control';
import {Tile} from 'ol/layer';
import {WMTS} from 'ol/source';
import {getPreferedFormat} from '../format-utils';

/**
 * @param $http
 * @param HsMapService
 * @param HsUtilsService
 * @param $rootScope
 */
export default function ($http, HsMapService, HsUtilsService, $rootScope) {
  'ngInject';
  const me = this;

  /**
   * Get WMTS service location without parameters from url string
   *
   * @memberof HsWmtsGetCapabilitiesService
   * @function getPathFromUrl
   * @param {string} str Url string to parse
   * @returns {string} WMTS service Url
   */
  this.getPathFromUrl = function (str) {
    if (str.indexOf('?') > -1) {
      return str.substring(0, str.indexOf('?'));
    } else {
      return str;
    }
  };

  /**
   * TODO: Probably the same as utils.paramsToURL
   * Create WMTS parameter string from parameter object
   *
   * @memberof HsWmtsGetCapabilitiesService
   * @function param2String
   * @param {object} obj Object with stored WNS service parameters
   * @returns {string} Parameter string or empty string if no object given
   */
  this.params2String = function (obj) {
    return obj
      ? Object.keys(obj)
          .map((key) => {
            const val = obj[key];

            if (angular.isArray(val)) {
              return val
                .map((val2) => {
                  return (
                    encodeURIComponent(key) + '=' + encodeURIComponent(val2)
                  );
                })
                .join('&');
            }

            return encodeURIComponent(key) + '=' + encodeURIComponent(val);
          })
          .join('&')
      : '';
  };

  /**
   * Parse added service url and sends GetCapabalities request to WMTS service
   *
   * @memberof HsWmtsGetCapabilitiesService
   * @function requestGetCapabilities
   * @param {string} service_url Raw Url localization of service
   * @returns {Promise} Promise object -  Response to GetCapabalities request
   */
  this.requestGetCapabilities = function (service_url) {
    service_url = service_url.replace(/&amp;/g, '&');
    const params = HsUtilsService.getParamsFromUrl(service_url);
    const path = this.getPathFromUrl(service_url);
    if (
      angular.isUndefined(params.request) &&
      angular.isUndefined(params.REQUEST)
    ) {
      params.request = 'GetCapabilities';
    } else if (angular.isDefined(params.request)) {
      params.request = 'GetCapabilities';
    } else if (angular.isDefined(params.REQUEST)) {
      params.REQUEST = 'GetCapabilities';
    }
    if (
      angular.isUndefined(params.service) &&
      angular.isUndefined(params.SERVICE)
    ) {
      params.service = 'wmts';
    }
    if (
      angular.isUndefined(params.version) &&
      angular.isUndefined(params.VERSION)
    ) {
      params.version = '1.3.0';
    }
    let url = [path, me.params2String(params)].join('?');

    url = HsUtilsService.proxify(url);
    const promise = $http.get(url);
    promise.then((r) => {
      $rootScope.$broadcast('ows_wmts.capabilities_received', r);
    });
    return promise;
  };

  /**
   * Load all layers of selected service to the map
   *
   * @memberof HsWmtsGetCapabilitiesService
   * @function service2layers
   * @param {string} capabilities_xml Xml response of GetCapabilities of selected service
   * @returns {Ol.collection} List of layers from service
   */
  this.service2layers = function (capabilities_xml) {
    const parser = new WMTSCapabilities();
    const caps = parser.read(capabilities_xml);
    const service = caps.Capability.Layer;
    //const srss = caps.Capability.Layer.CRS;
    const image_formats = caps.Capability.Request.GetMap.Format;
    const query_formats = caps.Capability.Request.GetFeatureInfo
      ? caps.Capability.Request.GetFeatureInfo.Format
      : [];
    const image_format = getPreferedFormat(image_formats, [
      'image/png; mode=8bit',
      'image/png',
      'image/gif',
      'image/jpeg',
    ]);
    const query_format = getPreferedFormat(query_formats, [
      'application/vnd.esri.wmts_featureinfo_xml',
      'application/vnd.ogc.gml',
      'application/vnd.ogc.wmts_xml',
      'text/plain',
      'text/html',
    ]);

    const tmp = [];
    angular.forEach(service, function () {
      angular.forEach(this.Layer, function () {
        const layer = this;
        let attributions = [];
        if (layer.Attribution) {
          attributions = [
            new Attribution({
              html:
                '<a href="' +
                layer.Attribution.OnlineResource +
                '">' +
                layer.Attribution.Title +
                '</a>',
            }),
          ];
        }
        const new_layer = new Tile({
          title: layer.Title.replace(/\//g, '&#47;'),
          source: new WMTS({
            url:
              caps.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource,
            attributions: attributions,
            styles:
              layer.Style && layer.Style.length > 0
                ? layer.Style[0].Name
                : undefined,
            params: {
              LAYERS: layer.Name,
              INFO_FORMAT: layer.queryable ? query_format : undefined,
              FORMAT: image_format,
            },
            crossOrigin: 'anonymous',
          }),
          abstract: layer.Abstract,
          useInterimTilesOnError: false,
          MetadataURL: layer.MetadataURL,
          BoundingBox: layer.BoundingBox,
        });
        tmp.push(new_layer);
      });
    });
    return tmp;
  };

  /**
   * Test if current map projection is in supported projection list
   *
   * @memberof HsWmtsGetCapabilitiesService
   * @function currentProjectionSupported
   * @param {Array} srss List of supported projections
   * @returns {boolean} True if map projection is in list, otherwise false
   */
  this.currentProjectionSupported = function (srss) {
    let found = false;
    angular.forEach(srss, (val) => {
      if (
        HsMapService.map.getView().getProjection().getCode().toUpperCase() ==
        val.toUpperCase()
      ) {
        found = true;
      }
    });
    return found;
  };
  return me;
}
