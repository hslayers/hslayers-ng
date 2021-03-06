import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Attribution} from 'ol/control';
import {Layer, Tile} from 'ol/layer';
import {TileWMS} from 'ol/source';
import {WMSCapabilities} from 'ol/format';
import {takeUntil} from 'rxjs/operators';

import {HsAddDataService} from '../../components/add-data/add-data.service';
import {HsCommonEndpointsService} from '../endpoints/endpoints.service';
import {HsEventBusService} from '../../components/core/event-bus.service';
import {HsMapService} from '../../components/map/map.service';
import {HsUtilsService} from '../../components/utils/utils.service';
import {Metadata} from '../layer-extensions';
import {getPreferedFormat} from '../format-utils';

@Injectable({providedIn: 'root'})
export class HsWmsGetCapabilitiesService {
  constructor(
    private httpClient: HttpClient,
    public hsEventBusService: HsEventBusService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsAddDataService: HsAddDataService
  ) {}

  /**
   * Get WMS service location without parameters from url string
   *
   * @param str Url string to parse
   * @return WMS service Url
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
   * @param obj Object with stored WMS service parameters
   * @return Parameter string or empty string if no object given
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
   * @param service_url Raw Url localization of service
   * @param [options]
   * @param [options.castOwsCapabilitiesReceived=true] - Whether or not to cast
   *   next value of owsCapabilitiesReceived subject
   * @return Promise object - Response to GetCapabalities request
   */
  async requestGetCapabilities(
    service_url: string,
    {castOwsCapabilitiesReceived} = {
      'castOwsCapabilitiesReceived': true,
    }
  ): Promise<any> {
    service_url = service_url.replace(/&amp;/g, '&');
    const params = this.hsUtilsService.getParamsFromUrl(service_url);
    const path = this.getPathFromUrl(service_url);
    if (params.request === undefined && params.REQUEST === undefined) {
      params.request = 'GetCapabilities';
    } else if (params.request !== undefined) {
      params.request = 'GetCapabilities';
    } else if (params.REQUEST !== undefined) {
      params.REQUEST = 'GetCapabilities';
    }
    if (params.service === undefined && params.SERVICE === undefined) {
      params.service = 'WMS';
    }
    if (params.version === undefined && params.VERSION === undefined) {
      params.version = '1.3.0';
    }
    let url = [path, this.params2String(params)].join('?');

    url = this.hsUtilsService.proxify(url);

    try {
      const r = await this.httpClient
        .get(url, {
          responseType: 'text',
          withCredentials: url.includes(
            this.hsCommonEndpointsService?.endpoints.filter(
              (ep) => ep.type == 'layman'
            )[0]?.url
          ),
        })
        .pipe(takeUntil(this.hsAddDataService.cancelUrlRequest))
        .toPromise();
      if (castOwsCapabilitiesReceived) {
        this.hsEventBusService.owsCapabilitiesReceived.next({
          type: 'WMS',
          response: r,
        });
      }
      return r;
    } catch (e) {
      this.hsEventBusService.owsCapabilitiesReceived.next({
        type: 'WMS',
        response: e,
        error: true,
      });
      throw e;
    }
  }

  /**
   * Load all layers of selected service to the map
   *
   * @param capabilities_xml XML response of GetCapabilities of selected service
   * @param path
   * @return List of layers from service
   */
  service2layers(capabilities_xml, path: string): Layer[] {
    const parser = new WMSCapabilities();
    const caps = parser.read(capabilities_xml);
    let service = caps.Capability.Layer;
    if (service.length == undefined && service.Layer != undefined) {
      service = [service];
    }
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
      'application/vnd.esri.wms_featureinfo_xml',
      'application/vnd.ogc.gml',
      'application/vnd.ogc.wms_xml',
      'text/plain',
      'text/html',
    ]);

    const tmp = [];
    service.forEach((service) => {
      service.Layer.forEach((layer) => {
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
        const metadata: Metadata = this.getMetadataObjectWithUrls(layer);
        const new_layer = new Tile({
          title: layer.Title.replace(/\//g, '&#47;'),
          name: layer.Name.replace(/\//g, '&#47;'),
          path,
          source: new TileWMS({
            url: caps.Capability.Request.GetMap.DCPType[0].HTTP.Get
              .OnlineResource,
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
          metadata,
          extent: layer.BoundingBox,
        });
        this.hsMapService.proxifyLayerLoader(new_layer, true);
        tmp.push(new_layer);
      });
    });
    return tmp;
  }

  getMetadataObjectWithUrls(layer: any): Metadata {
    if (layer.MetadataURL) {
      const metadata = {
        urls: layer.MetadataURL.map((url) => {
          return {
            type: url.type,
            format: url.Format,
            onlineResource: url.OnlineResource,
          };
        }),
      };
      return metadata;
    }
  }

  /**
   * Test if current map projection is in supported projection list
   *
   * @param srss List of supported projections
   * @return True if map projection is in list, otherwise false
   */
  currentProjectionSupported(srss: string[]): boolean {
    let found = false;
    for (const val of srss) {
      if (
        this.hsMapService.map
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
