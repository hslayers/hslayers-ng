import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import {Attribution} from 'ol/control';
import {HsEventBusService} from '../../components/core/event-bus.service';
import {HsMapService} from '../../components/map/map.service';
import {HsUtilsService} from '../../components/utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Tile} from 'ol/layer';
import {WMTS} from 'ol/source';
import {getPreferedFormat} from '../format-utils';

@Injectable({providedIn: 'root'})
export class HsWmtsGetCapabilitiesService {
  service_url: any;
  constructor(
    private HttpClient: HttpClient,
    private HsEventBusService: HsEventBusService,
    private HsMapService: HsMapService,
    private HsUtilsService: HsUtilsService
  ) {}

  /**
   * Get WMTS service location without parameters from url string
   *
   * @memberof HsWmtsGetCapabilitiesService
   * @function getPathFromUrl
   * @param {string} str Url string to parse
   * @returns {string} WMTS service Url
   */
  getPathFromUrl(str) {
    if (str.indexOf('?') > -1) {
      return str.substring(0, str.indexOf('?'));
    } else {
      return str;
    }
  }

  /**
   * TODO: Probably the same as utils.paramsToURL
   * Create WMTS parameter string from parameter object
   *
   * @memberof HsWmtsGetCapabilitiesService
   * @function param2String
   * @param {object} obj Object with stored WNS service parameters
   * @returns {string} Parameter string or empty string if no object given
   */
  params2String(obj) {
    return obj
      ? Object.keys(obj)
          .map((key) => {
            const val = obj[key];

            if (Array.isArray(val)) {
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
  }

  /**
   * Parse added service url and sends GetCapabalities request to WMTS service
   *
   * @memberof HsWmtsGetCapabilitiesService
   * @function requestGetCapabilities
   * @param {string} service_url Raw Url localization of service
   * @returns {Promise} Promise object -  Response to GetCapabalities request
   */
  async requestGetCapabilities(service_url): Promise<any> {
    service_url = service_url.replace(/&amp;/g, '&');
    const params = this.HsUtilsService.getParamsFromUrl(service_url);
    const path = this.getPathFromUrl(service_url);
    if (params.request == undefined && params.REQUEST == undefined) {
      params.request = 'GetCapabilities';
    } else if (params.request != undefined) {
      params.request = 'GetCapabilities';
    } else if (params.REQUEST != undefined) {
      params.REQUEST = 'GetCapabilities';
    }
    if (params.service == undefined && params.SERVICE == undefined) {
      params.service = 'wmts';
    }
    if (params.version == undefined && params.VERSION == undefined) {
      params.version = '1.3.0';
    }
    let url = [path, this.params2String(params)].join('?');

    url = this.HsUtilsService.proxify(url);
    const r = await this.HttpClient.get(url,{
      responseType: 'text',
    }).toPromise();

    this.HsEventBusService.owsCapabilitiesReceived.next({
      type: 'WMTS',
      response: r,
    });
    return r;
  }

  /**
   * Load all layers of selected service to the map
   *
   * @memberof HsWmtsGetCapabilitiesService
   * @function service2layers
   * @param {string} capabilities_xml Xml response of GetCapabilities of selected service
   * @returns {Ol.collection} List of layers from service
   */
  service2layers(capabilities_xml) {
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
    for (const subservice of service) {
      for (const layer of subservice.Layer) {
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
      }
    }
    return tmp;
  }

  /**
   * Test if current map projection is in supported projection list
   *
   * @memberof HsWmtsGetCapabilitiesService
   * @function currentProjectionSupported
   * @param {Array} srss List of supported projections
   * @returns {boolean} True if map projection is in list, otherwise false
   */
  currentProjectionSupported(srss) {
    let found = false;
    for (const val of srss) {
      if (
        this.HsMapService.map
          .getView()
          .getProjection()
          .getCode()
          .toUpperCase() == val.toUpperCase()
      ) {
        found = true;
      }
    }
    return found;
  }
}
