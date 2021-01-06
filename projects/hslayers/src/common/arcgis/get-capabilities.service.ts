import {Attribution} from 'ol/control';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Layer, Tile} from 'ol/layer';
import {TileWMS} from 'ol/source';

import {HsEventBusService} from '../../components/core/event-bus.service';
import {HsLogService} from '../log/log.service';
import {HsMapService} from '../../components/map/map.service';
import {HsUtilsService} from '../../components/utils/utils.service';
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
   * Parse added service url and sends GetCapabalities request to WMS service
   *
   * @param service_url - Raw Url localization of service
   * @returns Promise object - Response to GetCapabalities request
   */
  async requestGetCapabilities(service_url: string): Promise<any> {
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
   * @param caps - XML response of GetCapabilities of selected service
   * @returns List of layers from service
   */
  service2layers(caps): Layer[] {
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
