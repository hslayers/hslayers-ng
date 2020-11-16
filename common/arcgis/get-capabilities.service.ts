import '../../components/utils';
import {Attribution} from 'ol/control';
import {HsEventBusService} from '../../components/core/event-bus.service';
import {HsLogService} from '../log/log.service';
import {HsMapService} from '../../components/map/map.service';
import {HsUtilsService} from '../../components/utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Tile} from 'ol/layer';
import {TileWMS} from 'ol/source';
import {getPreferedFormat} from '../format-utils';

@Injectable({providedIn: 'root'})
export class HsArcgisGetCapabilitiesService {
  constructor(
    private HttpClient: HttpClient,
    public HsEventBusService: HsEventBusService,
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsLogService: HsLogService
  ) {}

  /**
   * Get WMS service location without parameters from url string
   *
   * @memberof HsArcgisGetCapabilitiesService
   * @function getPathFromUrl
   * @param {string} str Url string to parse
   * @returns {string} WMS service Url
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
   * Create WMS parameter string from parameter object
   *
   * @memberof HsArcgisGetCapabilitiesService
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
   * Parse added service url and sends GetCapabalities request to WMS service
   *
   * @memberof HsArcgisGetCapabilitiesService
   * @function requestGetCapabilities
   * @param {string} service_url Raw Url localization of service
   * @returns {Promise} Promise object - Response to GetCapabalities request
   */
  async requestGetCapabilities(service_url) {
    service_url = service_url.replace(/&amp;/g, '&');
    const params = this.HsUtilsService.getParamsFromUrl(service_url);
    const path = this.getPathFromUrl(service_url);
    params.f = 'json';
    let url = [path, this.params2String(params)].join('?');

    url = this.HsUtilsService.proxify(url);
    try {
      const r = await this.HttpClient.get(url, {
        responseType: 'text',
      }).toPromise();
      this.HsEventBusService.owsCapabilitiesReceived.next({
        type: 'ArcGIS',
        response: r,
      });
      return r;
    } catch (e) {
      throw e;
    }
  }

  /**
   * Load all layers of selected service to the map
   *
   * @memberof HsArcgisGetCapabilitiesService
   * @function service2layers
   * @param {string} caps Xml response of GetCapabilities of selected service
   * @returns {Ol.collection} List of layers from service
   */
  service2layers(caps) {
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
    for (const subservice of service) {
      this.HsLogService.log('Load service', subservice);
      for (const layer of subservice.Layer) {
        this.HsLogService.log('Load service', this);
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
        this.HsMapService.proxifyLayerLoader(new_layer, true);
        tmp.push(new_layer);
      }
    }
    return tmp;
  }

  /**
   * Test if current map projection is in supported projection list
   *
   * @memberof HsArcgisGetCapabilitiesService
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
