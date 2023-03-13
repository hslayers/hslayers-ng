import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Layer, Tile} from 'ol/layer';
import {Source, WMTS} from 'ol/source';
import {WMTSCapabilities} from 'ol/format';
import {lastValueFrom, takeUntil} from 'rxjs';

import {CapabilitiesResponseWrapper} from './capabilities-response-wrapper';
import {HsAddDataService} from '../../components/add-data/add-data.service';
import {HsCapabilityCacheService} from './capability-cache.service';
import {HsEventBusService} from '../../components/core/event-bus.service';
import {HsMapService} from '../../components/map/map.service';
import {HsUtilsService} from '../../components/utils/utils.service';
import {HsWmsGetCapabilitiesService} from './wms-get-capabilities.service';
import {IGetCapabilities} from './get-capabilities.interface';
import {getPreferredFormat} from '../format-utils';

@Injectable({providedIn: 'root'})
export class HsWmtsGetCapabilitiesService implements IGetCapabilities {
  service_url: any;
  constructor(
    private httpClient: HttpClient,
    public hsEventBusService: HsEventBusService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public hsAddDataService: HsAddDataService,
    public hsCapabilityCacheService: HsCapabilityCacheService
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
   * Parse added service url and sends GetCapabilities request to WMTS service
   *
   * @param service_url - Raw Url localization of service
   * @param owrCache - Overwrites cache for the requested url
   * @returns Promise object -  Response to GetCapabilities request
   */
  async request(
    service_url: string,
    app: string,
    owrCache?: boolean
  ): Promise<CapabilitiesResponseWrapper> {
    service_url = service_url.replace(/&amp;/g, '&');
    const params = this.hsUtilsService.getParamsFromUrl(service_url);
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

    if (this.hsCapabilityCacheService.get(url) && !owrCache) {
      return this.hsCapabilityCacheService.get(url);
    }
    try {
      url = this.hsUtilsService.proxify(url, app);
      const r = await lastValueFrom(
        this.httpClient
          .get(url, {
            responseType: 'text',
            observe: 'response', // Set observe to 'response' to get headers as well
          })
          .pipe(takeUntil(this.hsAddDataService.cancelUrlRequest))
      );
      const contentType = r.headers.get('Content-Type');
      if (contentType.includes('text/html')) {
        return {
          error: true,
          response: {
            message: 'ERROR.noValidData',
          },
        };
      }
      const wrap = {response: r.body};
      this.hsCapabilityCacheService.set(url, wrap);
      return wrap;
    } catch (error) {
      return {
        response: error,
        error: true,
      };
    }
  }

  /**
   * Load all layers of selected service to the map
   *
   * @param capabilities_xml - XML response of GetCapabilities of selected service
   * @returns List of layers from service
   */
  service2layers(capabilities_xml, app: string): Layer<Source>[] {
    const parser = new WMTSCapabilities();
    const caps = parser.read(capabilities_xml);
    const service = caps.Capability.Layer;
    //const srss = caps.Capability.Layer.CRS;
    const image_formats = caps.Capability.Request.GetMap.Format;
    const query_formats = caps.Capability.Request.GetFeatureInfo
      ? caps.Capability.Request.GetFeatureInfo.Format
      : [];
    const image_format = getPreferredFormat(image_formats, [
      'image/png; mode=8bit',
      'image/png',
      'image/gif',
      'image/jpeg',
    ]);
    const query_format = getPreferredFormat(query_formats, [
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
            `<a href="${layer.Attribution.OnlineResource}">${layer.Attribution.Title}</a>`,
          ];
        }
        const metadata =
          this.hsWmsGetCapabilitiesService.getMetadataObjectWithUrls(layer);
        const new_layer = new Tile({
          properties: {
            title: layer.Title.replace(/\//g, '&#47;'),
            abstract: layer.Abstract,
            metadata,
          },
          source: new WMTS({
            url: caps.Capability.Request.GetMap.DCPType[0].HTTP.Get
              .OnlineResource,
            attributions: attributions,
            style:
              layer.Style && layer.Style.length > 0
                ? layer.Style[0].Name
                : undefined,
            crossOrigin: 'anonymous',
          } as any),
          useInterimTilesOnError: false,
          extent: layer.BoundingBox,
        });
        tmp.push(new_layer);
      }
    }
    return tmp;
  }
}
