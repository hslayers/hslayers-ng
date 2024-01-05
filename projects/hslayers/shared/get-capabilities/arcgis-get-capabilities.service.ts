import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Layer, Tile} from 'ol/layer';
import {Source, TileWMS} from 'ol/source';
import {lastValueFrom, takeUntil} from 'rxjs';

import {CapabilitiesResponseWrapper} from 'hslayers-ng/common/types';
import {HsCapabilityCacheService} from './capability-cache.service';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {IGetCapabilities} from './get-capabilities.interface';
import {getPreferredFormat} from 'hslayers-ng/common/utils';

@Injectable({providedIn: 'root'})
export class HsArcgisGetCapabilitiesService implements IGetCapabilities {
  constructor(
    private httpClient: HttpClient,
    public hsEventBusService: HsEventBusService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsLogService: HsLogService,
    public hsCapabilityCacheService: HsCapabilityCacheService,
  ) {}

  /**
   * Get WMS service location without parameters from url string
   *
   * @param str - Url string to parse
   * @returns WMS service Url
   */
  getPathFromUrl(str: string): string {
    if (str.indexOf('?') > -1) {
      return str.substring(0, str.indexOf('?'));
    } else {
      return str;
    }
  }

  /**
   * Create WMS parameter string from parameter object
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
   * Parse added service url and sends GetCapabilities request to WMS service
   *
   * @param service_url - Raw Url localization of service
   * @param owrCache - Overwrites cache for the requested url
   * @returns Promise object - Response to GetCapabilities request
   */
  async request(
    service_url: string,
    owrCache?: boolean,
  ): Promise<CapabilitiesResponseWrapper> {
    service_url = service_url.replace(/&amp;/g, '&');
    const params = this.hsUtilsService.getParamsFromUrl(service_url);
    const path = this.getPathFromUrl(service_url);
    params.f = 'json';
    let url = [path, this.params2String(params)].join('?');

    url = this.hsUtilsService.proxify(url);

    if (this.hsCapabilityCacheService.get(url) && !owrCache) {
      return this.hsCapabilityCacheService.get(url);
    }
    try {
      const r = await lastValueFrom(
        this.httpClient
          .get(url, {
            responseType: 'json',
            observe: 'response', // Set observe to 'response' to get headers as well
          })
          .pipe(takeUntil(this.hsEventBusService.cancelAddDataUrlRequest)),
      );
      const wrap = {response: r.body};
      this.hsCapabilityCacheService.set(url, wrap);
      return wrap;
    } catch (e) {
      const contentType = e.headers.get('Content-Type');
      if (contentType?.includes('text/html')) {
        return {
          error: true,
          response: {
            message: 'ERROR.noValidData',
          },
        };
      }
      return {response: e, error: true};
    }
  }

  /**
   * Load all layers of selected service to the map
   *
   * @param caps - XML response of GetCapabilities of selected service
   * @returns List of layers from service
   */
  service2layers(caps): Layer<Source>[] {
    const service = caps.layers;
    //onst srss = caps.spatialReference.wkid;
    const image_formats = caps.supportedImageFormatTypes.split(',');
    const query_formats = caps.supportedQueryFormats
      ? caps.supportedQueryFormats.split(',')
      : [];
    const image_format = getPreferredFormat(image_formats, [
      'image/png; mode=8bit',
      'image/png',
      'image/gif',
      'image/jpeg',
    ]);
    const query_format = getPreferredFormat(query_formats, [
      'application/vnd.esri.wms_featureinfo_xml',
      'application/vnd.ogc.gml',
      'application/vnd.ogc.wms_xml',
      'text/plain',
      'text/html',
    ]);

    const tmp = [];
    for (const subservice of service) {
      this.hsLogService.log('Load service', subservice);
      for (const layer of subservice.Layer) {
        this.hsLogService.log('Load service', this);
        let attributions = [];
        if (layer.Attribution) {
          attributions = [
            `<a href="${layer.Attribution.OnlineResource}">${layer.Attribution.Title}</a>`,
          ];
        }
        const new_layer = new Tile({
          properties: {
            title: layer.Title.replace(/\//g, '&#47;'),
            abstract: layer.Abstract,
          },
          source: new TileWMS({
            url: caps.Capability.Request.GetMap.DCPType[0].HTTP.Get
              .OnlineResource,
            attributions: attributions,

            params: {
              LAYERS: layer.Name,
              INFO_FORMAT: layer.queryable ? query_format : undefined,
              FORMAT: image_format,
              styles:
                layer.Style && layer.Style.length > 0
                  ? layer.Style[0].Name
                  : undefined,
            },
            crossOrigin: 'anonymous',
          }),
          useInterimTilesOnError: false,
          extent: layer.BoundingBox,
        });
        this.hsMapService.proxifyLayerLoader(new_layer, true);
        tmp.push(new_layer);
      }
    }
    return tmp;
  }
}
