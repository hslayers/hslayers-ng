import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import {Attribution} from 'ol/control';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Layer, Tile} from 'ol/layer';
import {WMTS} from 'ol/source';

import {HsEventBusService} from '../../components/core/event-bus.service';
import {HsMapService} from '../../components/map/map.service';
import {HsUtilsService} from '../../components/utils/utils.service';
import {getPreferedFormat} from '../format-utils';

@Injectable({providedIn: 'root'})
export class HsWmtsGetCapabilitiesService {
  service_url: any;
  constructor(
    private HttpClient: HttpClient,
    public HsEventBusService: HsEventBusService,
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService
  ) {}

  /**
   * Get WMTS service location without parameters from url string
   *
   * @param str - Url string to parse
   * @returns WMTS service Url
   */
  getPathFromUrl(str: string): string {
    if (str.indexOf('?') > -1) {
      return str.substring(0, str.indexOf('?'));
    } else {
      return str;
    }
  }

  /**
   * Create WMTS parameter string from parameter object
   * TODO: Probably the same as utils.paramsToURL
   *
   * @param obj - Object with stored WMS service parameters
   * @returns Parameter string or empty string if no object given
   */
  params2String(obj): string {
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
   * @param service_url - Raw Url localization of service
   * @returns Promise object -  Response to GetCapabalities request
   */
  async requestGetCapabilities(service_url: string): Promise<any> {
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

    try {
      url = this.HsUtilsService.proxify(url);
      const r = await this.HttpClient.get(url, {
        responseType: 'text',
      }).toPromise();

      this.HsEventBusService.owsCapabilitiesReceived.next({
        type: 'WMTS',
        response: r,
      });
      return r;
    } catch (error) {
      this.HsEventBusService.owsCapabilitiesReceived.next({
        type: 'error',
        response: error,
      });
      throw error;
    }
  }

  /**
   * Load all layers of selected service to the map
   *
   * @param capabilities_xml - XML response of GetCapabilities of selected service
   * @returns List of layers from service
   */
  service2layers(capabilities_xml): Layer[] {
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
   * @param srss - List of supported projections
   * @returns True if map projection is in list, otherwise false
   */
  currentProjectionSupported(srss: string[]): boolean {
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
