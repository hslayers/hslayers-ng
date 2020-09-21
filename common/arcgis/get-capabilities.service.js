import '../../components/utils';
import {Attribution} from 'ol/control';
import {Tile} from 'ol/layer';
import {TileWMS} from 'ol/source';
import {getPreferedFormat} from '../format-utils';

/**
 * @param $http
 * @param HsMapService
 * @param HsUtilsService
 * @param $rootScope
 * @param $log
 */
export default function (
  $http,
  HsEventBusService,
  HsMapService,
  HsUtilsService,
  $rootScope,
  $log
) {
  'ngInject';
  const me = this;

  /**
   * Get WMS service location without parameters from url string
   *
   * @memberof HsArcgisGetCapabilitiesService
   * @function getPathFromUrl
   * @param {string} str Url string to parse
   * @returns {string} WMS service Url
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
   * Create WMS parameter string from parameter object
   *
   * @memberof HsArcgisGetCapabilitiesService
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
   * Parse added service url and sends GetCapabalities request to WMS service
   *
   * @memberof HsArcgisGetCapabilitiesService
   * @function requestGetCapabilities
   * @param {string} service_url Raw Url localization of service
   * @returns {Promise} Promise object - Response to GetCapabalities request
   */
  this.requestGetCapabilities = function (service_url) {
    service_url = service_url.replace(/&amp;/g, '&');
    const params = HsUtilsService.getParamsFromUrl(service_url);
    const path = this.getPathFromUrl(service_url);
    params.f = 'json';
    let url = [path, me.params2String(params)].join('?');

    url = HsUtilsService.proxify(url);
    return new Promise((resolve, reject) => {
      $http
        .get(url)
        .then((r) => {
          HsEventBusService.owsCapabilitiesReceived.next({
            type: 'ArcGIS',
            response: r,
          });
          resolve(r.data);
        })
        .catch((e) => {
          reject(e);
        });
    });
  };

  /**
   * Load all layers of selected service to the map
   *
   * @memberof HsArcgisGetCapabilitiesService
   * @function service2layers
   * @param {string} caps Xml response of GetCapabilities of selected service
   * @returns {Ol.collection} List of layers from service
   */
  this.service2layers = function (caps) {
    const service = caps.layers;
    //onst srss = caps.spatialReference.wkid;
    const image_formats = caps.supportedImageFormatTypes.split(',');
    const query_formats = caps.supportedQueryFormats
      ? caps.supportedQueryFormats.split(',')
      : [];
    const image_format = getPreferedFormat(image_formats, [
      'image/png; mode=8bit',
      'image/png',
      'image/gif',
      'image/jpeg',
    ]);
    const query_format = getPreferedFormat(query_formats, [
      'application/vnd.esri.wms_featureinfo_xml',
      'application/vnd.ogc.gml',
      'application/vnd.ogc.wms_xml',
      'text/plain',
      'text/html',
    ]);

    const tmp = [];
    angular.forEach(service, function () {
      $log.log('Load service', this);
      angular.forEach(this.Layer, function () {
        const layer = this;
        $log.log('Load service', this);
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
          source: new TileWMS({
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
        HsMapService.proxifyLayerLoader(new_layer, true);
        tmp.push(new_layer);
      });
    });
    return tmp;
  };

  /**
   * Test if current map projection is in supported projection list
   *
   * @memberof HsArcgisGetCapabilitiesService
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
